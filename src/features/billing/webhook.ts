import 'server-only'
import type Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getProPriceId } from './config'
import { getSubscriptionUpdate, hasProPrice, isOpenSubscription } from './subscription-state'

export const BILLING_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed'
])

function getEventCustomer(event: Stripe.Event): string | null {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const customer = event.data.object.customer
      return typeof customer === 'string' ? customer : (customer?.id ?? null)
    }
    default:
      return null
  }
}

export async function reconcileBillingEvent(event: Stripe.Event) {
  const customerId = getEventCustomer(event)
  if (!customerId) return false
  // The persisted customer binding is authoritative. Never grant access using event metadata or email.
  const owner = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId }, select: { userId: true } })
  if (!owner) return false
  const priceId = getProPriceId()

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${owner.userId} FOR UPDATE`
      if (await tx.stripeWebhookEvent.findUnique({ where: { id: event.id }, select: { id: true } })) return false
      const previous = await tx.subscription.findUnique({ where: { userId: owner.userId } })
      if (!previous || previous.stripeCustomerId !== customerId) return false

      // Retrieve AFTER acquiring the lock. Two out-of-order handlers cannot overwrite a newer snapshot.
      // Inspect the customer's current subscriptions so events for a previous subscription cannot replace its successor.
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100, expand: ['data.latest_invoice'] })
      if (subscriptions.has_more) throw new Error('Too many subscriptions to reconcile safely.')
      const candidates = subscriptions.data.filter((subscription) => hasProPrice(subscription, priceId))
      candidates.sort(
        (a, b) =>
          Number(b.status === 'active') - Number(a.status === 'active') ||
          Number(isOpenSubscription(b)) - Number(isOpenSubscription(a)) ||
          b.created - a.created ||
          b.id.localeCompare(a.id)
      )
      let current = candidates[0]
      if (!current && previous.stripeSubscriptionId) {
        current = await stripe.subscriptions.retrieve(previous.stripeSubscriptionId, { expand: ['latest_invoice'] })
      }
      if (current) {
        const currentCustomer = typeof current.customer === 'string' ? current.customer : current.customer.id
        if (currentCustomer !== customerId || current.livemode !== event.livemode) throw new Error('Subscription customer or mode mismatch.')
        await tx.subscription.update({ where: { userId: owner.userId }, data: getSubscriptionUpdate(current, previous, priceId) })
      }
      await tx.stripeWebhookEvent.create({ data: { id: event.id, type: event.type, stripeCreatedAt: new Date(event.created * 1000) } })
      return true
    },
    { timeout: 60000, maxWait: 10000 }
  )
}
