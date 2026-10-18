import 'server-only'
import type Stripe from 'stripe'
import { getPaidListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { getRecognizedPrices } from './config'
import { recordSubscriptionPayment } from './subscription-payments'
import { getSubscriptionUpdate, hasPlanPrice, isOpenSubscription, recoverPaidSubscriptionPeriod } from './subscription-state'

export const BILLING_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'invoice.paid',
  'invoice.payment_failed'
])

function getEventCustomer(event: Stripe.Event): string | null {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.pending_update_applied':
    case 'customer.subscription.pending_update_expired':
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
  const prices = getRecognizedPrices()

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${owner.userId} FOR UPDATE`
      const processed = await tx.stripeWebhookEvent.findUnique({ where: { id: event.id }, select: { id: true } })
      if (processed && event.type !== 'invoice.paid') return false
      const previous = await tx.subscription.findUnique({ where: { userId: owner.userId } })
      if (!previous || previous.stripeCustomerId !== customerId) return false

      if (event.type === 'invoice.paid') {
        // Replayed events processed before the payment ledger existed may fill its
        // missing snapshot. The unique invoice still makes this operation idempotent.
        await recordSubscriptionPayment(tx, event.data.object.id, owner.userId, customerId, prices, event.livemode)
      }
      if (processed) return false

      // Retrieve AFTER acquiring the lock. Two out-of-order handlers cannot overwrite a newer snapshot.
      // Inspect the customer's current subscriptions so events for a previous subscription cannot replace its successor.
      const subscriptions = await getStripe().subscriptions.list({ customer: customerId, status: 'all', limit: 100, expand: ['data.latest_invoice'] })
      if (subscriptions.has_more) throw new Error('Too many subscriptions to reconcile safely.')
      if (subscriptions.data.some((subscription) => isOpenSubscription(subscription) && !hasPlanPrice(subscription, prices)))
        throw new Error('An open subscription has an unrecognized price. Check the current and legacy price configuration.')
      const candidates = subscriptions.data.filter((subscription) => hasPlanPrice(subscription, prices))
      if (candidates.filter(isOpenSubscription).length > 1) throw new Error('Multiple open subscriptions require billing review.')
      candidates.sort(
        (a, b) =>
          Number(b.status === 'active') - Number(a.status === 'active') ||
          Number(isOpenSubscription(b)) - Number(isOpenSubscription(a)) ||
          b.created - a.created ||
          b.id.localeCompare(a.id)
      )
      let current = candidates[0]
      if (!current && previous.stripeSubscriptionId) {
        current = await getStripe().subscriptions.retrieve(previous.stripeSubscriptionId, { expand: ['latest_invoice'] })
      }
      if (current) {
        const currentCustomer = typeof current.customer === 'string' ? current.customer : current.customer.id
        if (currentCustomer !== customerId || current.livemode !== event.livemode) throw new Error('Subscription customer or mode mismatch.')
        const invoice = current.latest_invoice
        if (invoice && typeof invoice !== 'string' && invoice.lines.has_more) {
          invoice.lines = await getStripe().invoices.listLineItems(invoice.id, { limit: 100 })
          if (invoice.lines.has_more) throw new Error('Too many invoice lines to verify safely.')
        }
        let baseline = previous
        if (
          current.status === 'active' &&
          getPaidListingPlan(previous) === 'FREE' &&
          invoice &&
          typeof invoice !== 'string' &&
          invoice.lines.data.some((line) => line.parent?.subscription_item_details?.proration)
        ) {
          const paidInvoices = await getStripe().invoices.list({ subscription: current.id, status: 'paid', limit: 100 })
          const recovered = recoverPaidSubscriptionPeriod(current, previous, prices, paidInvoices.data)
          baseline = { ...previous, ...recovered }
        }
        await tx.subscription.update({ where: { userId: owner.userId }, data: getSubscriptionUpdate(current, baseline, prices) })
      }
      await tx.stripeWebhookEvent.create({ data: { id: event.id, type: event.type, stripeCreatedAt: new Date(event.created * 1000) } })
      return true
    },
    { timeout: 60000, maxWait: 10000 }
  )
}
