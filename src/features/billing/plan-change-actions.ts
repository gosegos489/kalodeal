'use server'

import { createHash, randomUUID } from 'node:crypto'
import 'server-only'
import type Stripe from 'stripe'
import z from 'zod'
import { stripeInvoiceUrlSchema } from '@/features/orders/schema'
import type { Prisma } from '@/generated/prisma/client'
import { localizeHref, routing } from '@/i18n/routing'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionResult } from '@/lib/action-result'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { LISTING_PLANS, type PaidPlan, getPaidListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'
import { getStripe } from '@/lib/stripe'
import { getPlanPrice, getRecognizedPrices, getStripeLiveMode } from './config'
import {
  type PlanChangePreview,
  type PlanChangeQuote,
  getDowngradePhases,
  getPlanChangeKind,
  isAppDowngradeSchedule,
  readPlanChangeQuote,
  signPlanChangeQuote,
  stripeId
} from './plan-change-state'
import { isOpenSubscription } from './subscription-state'

class PlanChangeError extends Error {}
const staleMessage = 'Your billing state changed. Reload the page and review the plan change again.'

async function withBillingOwner<T>(work: (tx: Prisma.TransactionClient, userId: string) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const session = await getMutationSession()
    if (!session) throw new PlanChangeError('Sign in to manage your subscription.')
    if (!canUseMarketplace(session.user.role)) throw new PlanChangeError('Moderator accounts cannot use marketplace actions.')
    const data = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${session.user.id} FOR UPDATE`
        if (!(await isActiveMarketplaceUser(tx, session.user.id))) throw new PlanChangeError('This account is unavailable.')
        return work(tx, session.user.id)
      },
      { timeout: 60000, maxWait: 10000 }
    )
    return { success: true, data }
  } catch (error) {
    if (error instanceof PlanChangeError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'billing', operation: 'plan-change' })
    return { success: false, message: 'Billing is temporarily unavailable. Please try again.' }
  }
}

async function getCurrentSubscription(tx: Prisma.TransactionClient, userId: string) {
  const previous = await tx.subscription.findUnique({ where: { userId } })
  if (!previous?.stripeCustomerId) throw new PlanChangeError('There is no Stripe subscription to manage.')
  const all = await getStripe().subscriptions.list({
    customer: previous.stripeCustomerId,
    status: 'all',
    limit: 100,
    expand: ['data.latest_invoice']
  })
  const open = all.data.filter(isOpenSubscription)
  if (all.has_more || open.length > 1) throw new PlanChangeError('Billing needs review. Please contact support.')
  const current = open[0]
  if (!current || stripeId(current.customer) !== previous.stripeCustomerId || current.livemode !== getStripeLiveMode())
    throw new PlanChangeError('There is no Stripe subscription to manage.')
  const item = current.items.data.length === 1 && !current.items.has_more ? current.items.data[0] : undefined
  const from = item ? getRecognizedPrices()[item.price.id] : undefined
  if (!item || !from || item.quantity !== 1 || current.collection_method !== 'charge_automatically' || current.pause_collection)
    throw new PlanChangeError('Billing needs review. Please contact support.')
  return { previous, current, item, from }
}

function requireConfirmedPeriod(state: Awaited<ReturnType<typeof getCurrentSubscription>>) {
  const { previous, current, item, from } = state
  if (
    current.status !== 'active' ||
    current.pending_update ||
    current.cancel_at_period_end ||
    current.cancel_at !== null ||
    previous.stripeSubscriptionId !== current.id ||
    getPaidListingPlan(previous) !== from ||
    previous.currentPeriodStart.getTime() !== item.current_period_start * 1000 ||
    previous.currentPeriodEnd.getTime() !== item.current_period_end * 1000
  )
    throw new PlanChangeError('Wait for payment confirmation or resolve your subscription in billing before changing plans.')
}

async function previewUpgrade(current: Stripe.Subscription, item: Stripe.SubscriptionItem, priceId: string, prorationDate: number) {
  const invoice = await getStripe().invoices.createPreview({
    customer: stripeId(current.customer) ?? undefined,
    subscription: current.id,
    subscription_details: {
      items: [{ id: item.id, price: priceId, quantity: 1 }],
      proration_behavior: 'always_invoice',
      proration_date: prorationDate,
      billing_cycle_anchor: 'unchanged'
    }
  })
  if (invoice.currency !== 'eur' || !Number.isSafeInteger(invoice.amount_due) || invoice.amount_due < 0)
    throw new Error('Invalid plan change invoice preview.')
  return invoice.amount_due
}

function pendingInvoiceUrl(current: Stripe.Subscription) {
  const invoice = current.latest_invoice
  if (!invoice || typeof invoice === 'string' || !invoice.hosted_invoice_url || invoice.status !== 'open')
    throw new PlanChangeError('Wait for payment confirmation or resolve your subscription in billing before changing plans.')
  return stripeInvoiceUrlSchema.parse(invoice.hosted_invoice_url)
}

export async function previewPlanChange(input: unknown): Promise<ActionResult<PlanChangePreview | { url: string }>> {
  const parsed = z.enum(LISTING_PLANS).safeParse(input)
  if (!parsed.success) return { success: false, message: 'Choose a valid paid plan.' }
  return withBillingOwner(async (tx, userId) => {
    const state = await getCurrentSubscription(tx, userId)
    const { current, item, from } = state
    const plan = parsed.data
    if (current.pending_update && plan !== 'FREE') return { url: pendingInvoiceUrl(current) }
    const kind = getPlanChangeKind(from, plan)
    if (kind !== 'cancel') requireConfirmedPeriod(state)
    if (kind === 'keep' && !current.schedule) throw new PlanChangeError('You are already on this plan.')
    if (current.schedule) {
      const schedule = await getStripe().subscriptionSchedules.retrieve(stripeId(current.schedule) ?? '')
      if (!isAppDowngradeSchedule(schedule, current.id)) throw new PlanChangeError('Billing needs review. Please contact support.')
      if (kind === 'upgrade' && schedule.phases.some((phase) => phase.start_date >= (schedule.current_phase?.end_date ?? 0)))
        throw new PlanChangeError('Remove the scheduled plan change before choosing an upgrade.')
    }
    const price = plan === 'FREE' ? null : await getPlanPrice(plan)
    const now = Math.floor(Date.now() / 1000)
    const amountDue = kind === 'upgrade' && price ? await previewUpgrade(current, item, price.id, now) : 0
    const quote: PlanChangeQuote = {
      userId,
      subscriptionId: current.id,
      itemId: item.id,
      oldPriceId: item.price.id,
      priceId: price?.id ?? null,
      plan,
      from,
      kind,
      periodStart: item.current_period_start,
      periodEnd: item.current_period_end,
      scheduleId: stripeId(current.schedule),
      pendingInvoiceId: current.pending_update ? stripeId(current.latest_invoice) : null,
      prorationDate: now,
      amountDue,
      currency: 'eur',
      issuedAt: now,
      nonce: randomUUID()
    }
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) throw new Error('Stripe is not configured.')
    return {
      plan,
      from,
      kind,
      amountDue,
      currency: 'eur',
      effectiveAt: new Date((kind === 'upgrade' || kind === 'keep' ? now : item.current_period_end) * 1000).toISOString(),
      renewsAt: new Date(item.current_period_end * 1000).toISOString(),
      token: signPlanChangeQuote(quote, secret)
    }
  })
}

export async function confirmPlanChange(tokenInput: unknown, localeInput: unknown = 'en'): Promise<ActionResult<{ url: string }>> {
  const token = z.string().max(6000).safeParse(tokenInput)
  const locale = z.enum(routing.locales).safeParse(localeInput)
  if (!token.success || !locale.success) return { success: false, message: staleMessage }
  return withBillingOwner(async (tx, userId) => {
    let quote: PlanChangeQuote
    try {
      quote = readPlanChangeQuote(token.data, process.env.STRIPE_SECRET_KEY ?? '', userId)
    } catch {
      throw new PlanChangeError(staleMessage)
    }
    const state = await getCurrentSubscription(tx, userId)
    const { current, item, from } = state
    const returnUrl = localizeHref('/account/subscription', locale.data)
    if (current.id !== quote.subscriptionId || item.id !== quote.itemId) throw new PlanChangeError(staleMessage)
    // Retrying a successful update or a pending payment never invoices the change twice.
    if (quote.kind === 'upgrade' && item.price.id === quote.priceId) return { url: returnUrl }
    if (quote.kind === 'cancel' && current.cancel_at_period_end) return { url: returnUrl }
    if (quote.kind === 'keep' && !current.schedule) return { url: returnUrl }
    if (current.pending_update && quote.kind !== 'cancel') return { url: pendingInvoiceUrl(current) }
    if (current.pending_update && stripeId(current.latest_invoice) !== quote.pendingInvoiceId) throw new PlanChangeError(staleMessage)
    if (
      item.price.id !== quote.oldPriceId ||
      from !== quote.from ||
      item.current_period_start !== quote.periodStart ||
      item.current_period_end !== quote.periodEnd
    )
      throw new PlanChangeError(staleMessage)
    if (quote.kind !== 'cancel') requireConfirmedPeriod(state)
    const key = createHash('sha256').update(token.data).digest('hex')
    let schedule = current.schedule ? await getStripe().subscriptionSchedules.retrieve(stripeId(current.schedule) ?? '') : null
    if (quote.kind === 'downgrade' && schedule && isAppDowngradeSchedule(schedule, current.id)) {
      const next = schedule.phases.find((phase) => phase.start_date === quote.periodEnd)
      if (next?.items.length === 1 && stripeId(next.items[0].price) === quote.priceId && next.items[0].quantity === 1) return { url: returnUrl }
    }
    const recoveringImport =
      quote.kind === 'downgrade' &&
      !quote.scheduleId &&
      schedule?.created !== undefined &&
      schedule.created >= quote.issuedAt &&
      schedule.phases.length === 1 &&
      schedule.end_behavior === 'release' &&
      !schedule.metadata?.kalodeal_plan_change
    if (stripeId(current.schedule) !== quote.scheduleId && !recoveringImport) throw new PlanChangeError(staleMessage)
    if (schedule && !isAppDowngradeSchedule(schedule, current.id) && !recoveringImport)
      throw new PlanChangeError('Billing needs review. Please contact support.')

    if (quote.kind === 'keep' || quote.kind === 'cancel') {
      if (quote.kind === 'cancel' && current.pending_update && quote.pendingInvoiceId)
        await getStripe().invoices.voidInvoice(quote.pendingInvoiceId, {}, { idempotencyKey: `kalodeal:cancel-pending:${key}` })
      if (schedule) await getStripe().subscriptionSchedules.release(schedule.id, {}, { idempotencyKey: `kalodeal:release:${key}` })
      if (quote.kind === 'cancel')
        await getStripe().subscriptions.update(current.id, { cancel_at_period_end: true }, { idempotencyKey: `kalodeal:cancel:${key}` })
      return { url: returnUrl }
    }
    const price = quote.plan === 'FREE' ? null : await getPlanPrice(quote.plan)
    if (!price || price.id !== quote.priceId) throw new PlanChangeError(staleMessage)
    if (quote.kind === 'upgrade') {
      if (schedule) {
        const currentPhaseEnd = schedule.current_phase?.end_date ?? 0
        if (schedule.phases.some((phase) => phase.start_date >= currentPhaseEnd)) throw new PlanChangeError(staleMessage)
        await getStripe().subscriptionSchedules.release(schedule.id, {}, { idempotencyKey: `kalodeal:release:${key}` })
      }
      if ((await previewUpgrade(current, item, price.id, quote.prorationDate)) !== quote.amountDue) throw new PlanChangeError(staleMessage)
      const updated = await getStripe().subscriptions.update(
        current.id,
        {
          items: [{ id: item.id, price: price.id, quantity: 1 }],
          billing_cycle_anchor: 'unchanged',
          proration_behavior: 'always_invoice',
          payment_behavior: 'pending_if_incomplete',
          proration_date: quote.prorationDate,
          expand: ['latest_invoice']
        },
        { idempotencyKey: `kalodeal:upgrade:${key}` }
      )
      return { url: updated.pending_update ? pendingInvoiceUrl(updated) : returnUrl }
    }
    // Attach a schedule to THIS subscription, never create a second subscription.
    schedule ??= await getStripe().subscriptionSchedules.create(
      { from_subscription: current.id },
      { idempotencyKey: `kalodeal:downgrade-attach:${key}` }
    )
    await getStripe().subscriptionSchedules.update(
      schedule.id,
      {
        end_behavior: 'release',
        metadata: { kalodeal_plan_change: 'downgrade' },
        proration_behavior: 'none',
        phases: getDowngradePhases(schedule, item, price.id)
      },
      { idempotencyKey: `kalodeal:downgrade:${key}` }
    )
    return { url: returnUrl }
  })
}

export async function getScheduledPlanChange(): Promise<ActionResult<{ plan: PaidPlan; effectiveAt: string; currentPlan: PaidPlan } | null>> {
  try {
    const session = await getMutationSession()
    if (!session || !canUseMarketplace(session.user.role)) return { success: false, message: 'Sign in to manage your subscription.' }
    const previous = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true, stripeSubscriptionId: true }
    })
    if (!previous?.stripeCustomerId || !previous.stripeSubscriptionId) return { success: true, data: null }
    // A display read must not hold the listing/quota user lock while waiting on Stripe.
    const current = await getStripe().subscriptions.retrieve(previous.stripeSubscriptionId, { expand: ['schedule'] })
    if (stripeId(current.customer) !== previous.stripeCustomerId || current.livemode !== getStripeLiveMode())
      throw new Error('Subscription ownership or mode mismatch.')
    const schedule = current.schedule
    if (!schedule || typeof schedule === 'string' || !isAppDowngradeSchedule(schedule, current.id)) return { success: true, data: null }
    const from = current.items.data.length === 1 && !current.items.has_more ? getRecognizedPrices()[current.items.data[0].price.id] : undefined
    const next = schedule.phases.find((phase) => phase.start_date === schedule.current_phase?.end_date)
    const plan = next?.items.length === 1 ? getRecognizedPrices()[stripeId(next.items[0].price) ?? ''] : undefined
    return {
      success: true,
      data: plan && next && from ? { plan, effectiveAt: new Date(next.start_date * 1000).toISOString(), currentPlan: from } : null
    }
  } catch (error) {
    await captureServerException(error, { feature: 'billing', operation: 'read-schedule' })
    return { success: false, message: 'Billing is temporarily unavailable. Please try again.' }
  }
}
