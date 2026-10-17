'use server'

import 'server-only'
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
import { getBillingOrigin, getPlanPrice, getPortalConfiguration } from './config'
import { isOpenSubscription } from './subscription-state'

class BillingError extends Error {}

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
    const [price, origin] = await Promise.all([getPlanPrice(plan), Promise.resolve(getBillingOrigin())])

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

        let customerId = subscription.stripeCustomerId
        if (!customerId) {
          const customer = await getStripe().customers.create(
            { email: session.user.email, name: session.user.name },
            { idempotencyKey: `kalodeal:customer:${userId}` }
          )
          customerId = customer.id
          await tx.subscription.update({ where: { userId }, data: { stripeCustomerId: customerId } })
        }

        // Check Stripe too: the webhook may not yet have reached the database.
        const existing = await getStripe().subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
        if (existing.has_more || existing.data.some(isOpenSubscription)) {
          throw new BillingError('A subscription already exists. Wait for payment confirmation or manage your billing before trying again.')
        }
        if (subscription.checkoutSessionId) {
          const checkout = await getStripe().checkout.sessions.retrieve(subscription.checkoutSessionId)
          if (checkout.customer !== customerId) throw new Error('Checkout customer mismatch.')
          if (checkout.status === 'open' && checkout.url && checkout.expires_at * 1000 > Date.now()) {
            const lines = await getStripe().checkout.sessions.listLineItems(checkout.id, { limit: 2 })
            if (
              lines.data.length === 1 &&
              lines.data[0].price?.id === price.id &&
              checkout.success_url === `${origin}${localizeHref('/account/subscription?checkout=success', locale.data)}` &&
              checkout.cancel_url === `${origin}${localizeHref('/account/subscription?checkout=canceled', locale.data)}`
            )
              return checkout.url
            // Replacing a still-open checkout cannot create a second subscription.
            await getStripe().checkout.sessions.expire(checkout.id)
          }
        }

        const attempt = subscription.checkoutAttempt + 1
        const checkout = await getStripe().checkout.sessions.create(
          {
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: price.id, quantity: 1 }],
            success_url: `${origin}${localizeHref('/account/subscription?checkout=success', locale.data)}`,
            cancel_url: `${origin}${localizeHref('/account/subscription?checkout=canceled', locale.data)}`,
            // No client ownership, plan, amount or currency is accepted.
            client_reference_id: userId
          },
          { idempotencyKey: `kalodeal:checkout:${userId}:${plan}:${attempt}` }
        )
        if (!checkout.url) throw new Error('Checkout URL is unavailable.')
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
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true, stripeSubscriptionId: true }
    })
    if (!subscription?.stripeCustomerId || !subscription.stripeSubscriptionId) {
      return { success: false, message: 'There is no Stripe subscription to manage.' }
    }
    const configuration = await getPortalConfiguration()
    if (!configuration) return { success: false, message: 'Subscription management is temporarily unavailable. Please try again later.' }
    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      configuration: configuration.id,
      return_url: `${getBillingOrigin()}${localizeHref('/account/subscription', locale.data)}`
    })
    return { success: true, data: { url: portal.url } }
  } catch (error) {
    await captureServerException(error, { feature: 'billing', operation: 'portal' })
    console.error('Could not open subscription management.')
    return { success: false, message: 'Subscription management is temporarily unavailable. Please try again.' }
  }
}
