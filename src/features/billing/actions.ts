'use server'

import 'server-only'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionResult } from '@/lib/action-result'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { getMutationSession } from '@/lib/auth-utils'
import { getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getBillingOrigin, getPortalConfiguration, getProPrice } from './config'
import { isOpenSubscription } from './subscription-state'

class BillingError extends Error {}

export async function upgradeToPro(): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to upgrade your plan.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }
    const userId = session.user.id
    const [price, origin] = await Promise.all([getProPrice(), Promise.resolve(getBillingOrigin())])

    const url = await prisma.$transaction(
      async (tx) => {
        // Cooperates with listing creation, bumps and webhook reconciliation across tabs and server instances.
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
        if (!(await isActiveMarketplaceUser(tx, userId))) throw new BillingError('This account is unavailable.')
        const subscription = await tx.subscription.upsert({
          where: { userId },
          create: { userId, status: 'EXPIRED', currentPeriodStart: new Date(0), currentPeriodEnd: new Date(0) },
          update: {}
        })
        if (getListingPlan(subscription) === 'PRO') throw new BillingError('You already have an eligible Pro plan.')

        let customerId = subscription.stripeCustomerId
        if (!customerId) {
          const customer = await stripe.customers.create(
            { email: session.user.email, name: session.user.name },
            { idempotencyKey: `kalodeal:customer:${userId}` }
          )
          customerId = customer.id
          await tx.subscription.update({ where: { userId }, data: { stripeCustomerId: customerId } })
        }

        // Check Stripe too: the webhook may not yet have reached the database.
        const existing = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
        if (existing.has_more || existing.data.some(isOpenSubscription)) {
          throw new BillingError('A subscription already exists. Wait for payment confirmation or manage your billing before trying again.')
        }
        if (subscription.checkoutSessionId) {
          const checkout = await stripe.checkout.sessions.retrieve(subscription.checkoutSessionId)
          if (checkout.customer !== customerId) throw new Error('Checkout customer mismatch.')
          if (checkout.status === 'open' && checkout.url && checkout.expires_at * 1000 > Date.now()) return checkout.url
        }

        const attempt = subscription.checkoutAttempt + 1
        const checkout = await stripe.checkout.sessions.create(
          {
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: price.id, quantity: 1 }],
            success_url: `${origin}/account/subscription?checkout=success`,
            cancel_url: `${origin}/account/subscription?checkout=canceled`,
            // No client ownership, plan, amount or currency is accepted.
            client_reference_id: userId
          },
          { idempotencyKey: `kalodeal:pro-checkout:${userId}:${attempt}` }
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
    console.error('Could not start PRO checkout.')
    return { success: false, message: 'Billing is temporarily unavailable. Please try again.' }
  }
}

export async function manageSubscription(): Promise<ActionResult<{ url: string }>> {
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
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      configuration: configuration.id,
      return_url: `${getBillingOrigin()}/account/subscription`
    })
    return { success: true, data: { url: portal.url } }
  } catch {
    console.error('Could not open subscription management.')
    return { success: false, message: 'Subscription management is temporarily unavailable. Please try again.' }
  }
}
