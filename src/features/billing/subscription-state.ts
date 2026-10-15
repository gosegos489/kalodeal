import type Stripe from 'stripe'
import type { Subscription } from '@/generated/prisma/client'
import { PLAN_LIMITS, type PaidPlan } from '@/lib/plan-limits'

type PreviousSubscription = Pick<Subscription, 'plan' | 'status' | 'stripeSubscriptionId' | 'currentPeriodStart' | 'currentPeriodEnd' | 'boostsUsed'>
export type RecognizedPrices = Partial<Record<string, PaidPlan>>

export function hasPlanPrice(subscription: Stripe.Subscription, prices: RecognizedPrices) {
  return subscription.items.data.some((item) => !!prices[item.price.id])
}
export function isOpenSubscription(subscription: Stripe.Subscription) {
  return subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired'
}

// Derive from a fresh Stripe object under the owner's lock, never from event metadata.
export function getSubscriptionUpdate(subscription: Stripe.Subscription, previous: PreviousSubscription, prices: RecognizedPrices, now = new Date()) {
  const item = subscription.items.data.length === 1 && !subscription.items.has_more ? subscription.items.data[0] : undefined
  const plan = item ? prices[item.price.id] : undefined
  const sameSubscription = previous.stripeSubscriptionId === subscription.id
  const periodStart = item ? new Date(item.current_period_start * 1000) : new Date(0)
  const periodEnd = item ? new Date(item.current_period_end * 1000) : new Date(0)
  const eligibleItem =
    !!plan &&
    !!item &&
    item.quantity === 1 &&
    item.price.type === 'recurring' &&
    (plan === 'PRO' || (item.price.currency === 'eur' && item.price.unit_amount === PLAN_LIMITS[plan].price)) &&
    item.price.recurring?.interval === 'month' &&
    item.price.recurring.interval_count === 1 &&
    item.price.recurring.usage_type === 'licensed'
  const active = subscription.status === 'active' && !subscription.pause_collection
  const previousPaid =
    sameSubscription &&
    previous.plan !== 'FREE' &&
    ['ACTIVE', 'CANCELED'].includes(previous.status) &&
    previous.currentPeriodStart <= now &&
    previous.currentPeriodEnd > now
  const invoice = subscription.latest_invoice
  const paid =
    !!item &&
    typeof invoice === 'object' &&
    invoice !== null &&
    invoice.status === 'paid' &&
    !invoice.lines.has_more &&
    invoice.lines.data.some((line) => {
      const details = line.parent?.subscription_item_details
      const price = line.pricing?.price_details?.price
      if (
        details?.subscription_item !== item.id ||
        (typeof price === 'string' ? price : price?.id) !== item.price.id ||
        line.period.end < item.current_period_end
      )
        return false
      if (!details.proration) return line.period.start <= item.current_period_start
      // Paid, invoiced upgrade for the remainder of an already verified period.
      // It never opens a new period or resets usage; unpaid changes retain the old tier.
      return (
        previousPaid &&
        !!plan &&
        PLAN_LIMITS[plan].price > PLAN_LIMITS[previous.plan].price &&
        line.amount > 0 &&
        previous.currentPeriodStart.getTime() === periodStart.getTime() &&
        previous.currentPeriodEnd.getTime() === periodEnd.getTime() &&
        line.period.start * 1000 <= now.getTime()
      )
    })
  const downgradeBeforeExpiry =
    previousPaid && !!plan && PLAN_LIMITS[plan].price < PLAN_LIMITS[previous.plan].price && periodStart < previous.currentPeriodEnd
  const acceptPeriod =
    eligibleItem &&
    !downgradeBeforeExpiry &&
    active &&
    paid &&
    Number.isFinite(periodStart.getTime()) &&
    periodEnd > periodStart &&
    (!sameSubscription || periodStart >= previous.currentPeriodStart)
  const retainPaid = previousPaid && !subscription.pause_collection && ['active', 'past_due', 'unpaid'].includes(subscription.status)
  const status: Subscription['status'] =
    acceptPeriod || retainPaid
      ? subscription.cancel_at_period_end || subscription.cancel_at !== null
        ? 'CANCELED'
        : 'ACTIVE'
      : subscription.status === 'past_due' || subscription.status === 'unpaid'
        ? 'PAST_DUE'
        : 'EXPIRED'
  return {
    stripeSubscriptionId: subscription.id,
    stripeStatus: subscription.status,
    plan: acceptPeriod && plan ? plan : sameSubscription ? previous.plan : ('FREE' as const),
    status,
    currentPeriodStart: acceptPeriod ? periodStart : sameSubscription ? previous.currentPeriodStart : new Date(0),
    currentPeriodEnd: acceptPeriod ? periodEnd : sameSubscription ? previous.currentPeriodEnd : new Date(0),
    boostsUsed: acceptPeriod && (!sameSubscription || periodStart > previous.currentPeriodStart) ? 0 : previous.boostsUsed
  }
}

export function isSafePortalConfiguration(configuration: Stripe.BillingPortal.Configuration, prices: RecognizedPrices) {
  const features = configuration.features
  const updates = features.subscription_update
  const safeChanges =
    !updates.enabled ||
    (updates.default_allowed_updates.length === 1 &&
      updates.default_allowed_updates[0] === 'price' &&
      updates.proration_behavior === 'always_invoice' &&
      updates.billing_cycle_anchor !== 'now' &&
      updates.schedule_at_period_end.conditions.some((condition) => condition.type === 'decreasing_item_amount') &&
      updates.products?.length === 1 &&
      updates.products.every((product) => product.prices.length > 0 && product.prices.every((price) => !!prices[price])))
  return (
    configuration.active &&
    features.payment_method_update.enabled &&
    features.customer_update.enabled &&
    features.customer_update.allowed_updates.includes('address') &&
    features.subscription_cancel.enabled &&
    features.subscription_cancel.mode === 'at_period_end' &&
    safeChanges
  )
}
