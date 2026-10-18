'use server'

import { headers } from 'next/headers'
import { createHash } from 'node:crypto'
import 'server-only'
import type Stripe from 'stripe'
import z from 'zod'
import { localizeHref, routing } from '@/i18n/routing'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionResult } from '@/lib/action-result'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { PAID_PLANS, getPaidListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'
import { getStripe } from '@/lib/stripe'
import { getBillingOrigin, getPlanPrice, getPortalConfiguration, getStripeLiveMode } from './config'
import { isOpenSubscription } from './subscription-state'

class BillingError extends Error {}

async function ensureStripeCustomer(userId: string, email: string, name: string) {
  // Commit the customer binding BEFORE creating any payable Checkout. Otherwise a failed
  // Checkout transaction can roll back the only link to a customer with a live subscription.
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
      if (!(await isActiveMarketplaceUser(tx, userId))) throw new BillingError('This account is unavailable.')
      const subscription = await tx.subscription.upsert({
        where: { userId },
        create: { userId, status: 'EXPIRED', currentPeriodStart: new Date(0), currentPeriodEnd: new Date(0) },
        update: {}
      })
      if (getPaidListingPlan(subscription) !== 'FREE')
        throw new BillingError('You already have a paid plan. Use Manage subscription to change plans.')
      if (subscription.stripeCustomerId) return
      const customer = await getStripe().customers.create({ email, name }, { idempotencyKey: `kalodeal:customer:${userId}` })
      await tx.subscription.update({ where: { userId }, data: { stripeCustomerId: customer.id } })
    },
    { timeout: 60000, maxWait: 10000 }
  )
}

export async function startPlanCheckout(input: unknown, localeInput: unknown = 'en'): Promise<ActionResult<{ url: string }>> {
  const parsed = z.enum(PAID_PLANS).safeParse(input)
  if (!parsed.success) return { success: false, message: 'Choose a valid paid plan.' }
  const locale = z.enum(routing.locales).safeParse(localeInput)
  if (!locale.success) return { success: false, message: 'Choose a valid paid plan.' }
  const plan = parsed.data
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to upgrade your plan.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const userId = session.user.id
    const origin = getBillingOrigin((await headers()).get('origin'))
    const price = await getPlanPrice(plan)
    await ensureStripeCustomer(userId, session.user.email, session.user.name)

    const url = await prisma.$transaction(
      async (tx) => {
        // Cooperates with listing creation, boosts and webhook reconciliation across tabs and server instances.
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
        if (!(await isActiveMarketplaceUser(tx, userId))) throw new BillingError('This account is unavailable.')
        const subscription = await tx.subscription.upsert({
          where: { userId },
          create: { userId, status: 'EXPIRED', currentPeriodStart: new Date(0), currentPeriodEnd: new Date(0) },
          update: {}
        })
        if (getPaidListingPlan(subscription) !== 'FREE')
          throw new BillingError('You already have a paid plan. Use Manage subscription to change plans.')

        const customerId = subscription.stripeCustomerId
        if (!customerId) throw new Error('The Stripe customer binding is unavailable.')

        // Check Stripe too: the webhook may not yet have reached the database.
        const existing = await getStripe().subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
        if (existing.has_more || existing.data.some(isOpenSubscription)) {
          throw new BillingError('A subscription already exists. Wait for payment confirmation or manage your billing before trying again.')
        }
        function isTerminalCheckout(checkout: Stripe.Checkout.Session) {
          const subscriptionId = typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id
          return checkout.status === 'complete' && existing.data.some((item) => item.id === subscriptionId && !isOpenSubscription(item))
        }
        if (subscription.checkoutSessionId) {
          const checkout = await getStripe().checkout.sessions.retrieve(subscription.checkoutSessionId)
          if (checkout.customer !== customerId) throw new Error('Checkout customer mismatch.')
          // A completion can race the subscriptions.list call above. Do not create a second subscription
          // while its first payment/webhook is still being confirmed. Terminal old subscriptions may repurchase.
          if (checkout.status === 'complete' && !isTerminalCheckout(checkout))
            throw new BillingError('A subscription already exists. Wait for payment confirmation or manage your billing before trying again.')
        }

        // Recover a Checkout created before a failed DB commit/response. Looking only at the local session ID
        // leaves an orphaned payable session when a retry selects a different plan.
        // Include completions: an orphaned Checkout can finish between subscriptions.list
        // and this read. Filtering for open sessions would miss it and permit another purchase.
        // Checkout expires within 24 hours; 48 hours also tolerates boundary/clock differences.
        const recent = await getStripe().checkout.sessions.list({
          customer: customerId,
          limit: 100,
          created: { gte: Math.floor(Date.now() / 1000) - 48 * 3600 }
        })
        if (recent.has_more) throw new Error('Too many recent checkouts to reconcile safely.')
        let reusable: (typeof recent.data)[number] | undefined
        for (const checkout of recent.data) {
          if (checkout.mode !== 'subscription') continue
          if (checkout.customer !== customerId || checkout.livemode !== getStripeLiveMode() || checkout.client_reference_id !== userId)
            throw new Error('Checkout identity mismatch.')
          if (checkout.status === 'expired') continue
          if (checkout.status === 'complete') {
            if (!isTerminalCheckout(checkout))
              throw new BillingError('A subscription already exists. Wait for payment confirmation or manage your billing before trying again.')
            continue
          }
          const lines = await getStripe().checkout.sessions.listLineItems(checkout.id, { limit: 2 })
          if (
            !reusable &&
            checkout.url &&
            checkout.expires_at * 1000 > Date.now() &&
            !lines.has_more &&
            lines.data.length === 1 &&
            lines.data[0].quantity === 1 &&
            lines.data[0].price?.id === price.id &&
            checkout.success_url === `${origin}${localizeHref('/account/subscription?checkout=success', locale.data)}` &&
            checkout.cancel_url === `${origin}${localizeHref('/account/subscription?checkout=canceled', locale.data)}`
          ) {
            reusable = checkout
          } else {
            // If payment completes concurrently, Stripe refuses expiration and we abort before creating another.
            await getStripe().checkout.sessions.expire(checkout.id)
          }
        }
        if (reusable?.url) {
          if (reusable.id !== subscription.checkoutSessionId)
            await tx.subscription.update({
              where: { userId },
              data: { checkoutSessionId: reusable.id, checkoutAttempt: { increment: 1 } }
            })
          return reusable.url
        }

        // Include the complete server-selected request in the key. A retry after a failed commit
        // may select another locale, deployment or configured price without colliding with the old request.
        let attempt = subscription.checkoutAttempt + 1
        const checkoutInput: Stripe.Checkout.SessionCreateParams = {
          mode: 'subscription',
          customer: customerId,
          line_items: [{ price: price.id, quantity: 1 }],
          success_url: `${origin}${localizeHref('/account/subscription?checkout=success', locale.data)}`,
          cancel_url: `${origin}${localizeHref('/account/subscription?checkout=canceled', locale.data)}`,
          locale: locale.data,
          // No client ownership, plan, amount or currency is accepted.
          client_reference_id: userId
        }
        let checkout: Stripe.Checkout.Session | undefined
        for (let retry = 0; retry < 3; retry++, attempt++) {
          const requestKey = createHash('sha256').update(JSON.stringify({ userId, checkoutInput, attempt })).digest('hex')
          const created = await getStripe().checkout.sessions.create(checkoutInput, {
            idempotencyKey: `kalodeal:checkout:${requestKey}`
          })
          // Idempotent POSTs replay the original response body, including its old status. Read the actual session.
          checkout = await getStripe().checkout.sessions.retrieve(created.id)
          if (checkout.customer !== customerId) throw new Error('Checkout customer mismatch.')
          // Skip only sessions that are no longer payable; an unconfirmed completion must block another purchase.
          if (checkout.status !== 'expired' && !isTerminalCheckout(checkout)) break
        }
        if (!checkout) throw new Error('Checkout is unavailable.')
        if (!checkout.url || checkout.status !== 'open') throw new Error('Checkout URL is unavailable.')
        await tx.subscription.update({ where: { userId }, data: { checkoutSessionId: checkout.id, checkoutAttempt: attempt } })
        return checkout.url
      },
      { timeout: 60000, maxWait: 10000 }
    )

    return { success: true, data: { url } }
  } catch (error) {
    if (error instanceof BillingError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'billing', operation: 'checkout' })
    console.error('Could not start subscription checkout.')
    return { success: false, message: 'Billing is temporarily unavailable. Please try again.' }
  }
}

export async function manageSubscription(localeInput: unknown = 'en'): Promise<ActionResult<{ url: string }>> {
  const locale = z.enum(routing.locales).safeParse(localeInput)
  if (!locale.success) return { success: false, message: 'Subscription management is temporarily unavailable. Please try again.' }
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to manage your subscription.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const configuration = await getPortalConfiguration()
    if (!configuration) return { success: false, message: 'Subscription management is temporarily unavailable. Please try again later.' }
    const returnUrl = `${getBillingOrigin((await headers()).get('origin'))}${localizeHref('/account/subscription', locale.data)}`
    const url = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${session.user.id} FOR UPDATE`
        if (!(await isActiveMarketplaceUser(tx, session.user.id))) throw new BillingError('This account is unavailable.')
        const subscription = await tx.subscription.findUnique({
          where: { userId: session.user.id },
          select: { stripeCustomerId: true, stripeSubscriptionId: true }
        })
        if (!subscription?.stripeCustomerId || !subscription.stripeSubscriptionId)
          throw new BillingError('There is no Stripe subscription to manage.')
        const portal = await getStripe().billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          configuration: configuration.id,
          return_url: returnUrl,
          locale: locale.data
        })
        return portal.url
      },
      { timeout: 60000, maxWait: 10000 }
    )
    return { success: true, data: { url } }
  } catch (error) {
    if (error instanceof BillingError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'billing', operation: 'portal' })
    console.error('Could not open subscription management.')
    return { success: false, message: 'Subscription management is temporarily unavailable. Please try again.' }
  }
}
