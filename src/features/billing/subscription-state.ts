import type Stripe from 'stripe'
import type { Subscription } from '@/generated/prisma/client'

type PreviousSubscription = Pick<Subscription, 'stripeSubscriptionId' | 'currentPeriodStart' | 'currentPeriodEnd' | 'bumpUsed'>

export function hasProPrice(subscription: Stripe.Subscription, priceId: string) {
  return subscription.items.data.some((item) => item.price.id === priceId)
}

export function isOpenSubscription(subscription: Stripe.Subscription) {
  return subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired'
}

// Always derive from a fresh Stripe object, never from the event's old snapshot.
export function getSubscriptionUpdate(subscription: Stripe.Subscription, previous: PreviousSubscription, priceId: string) {
  const item = subscription.items.data.find((entry) => entry.price.id === priceId)
  const invoice = subscription.latest_invoice
  const paid =
    !!item &&
    typeof invoice === 'object' &&
    invoice !== null &&
    invoice.status === 'paid' &&
    invoice.lines.data.some((line) => {
      const details = line.parent?.subscription_item_details
      const price = line.pricing?.price_details?.price
      return (
        details?.subscription_item === item.id &&
        !details.proration &&
        (typeof price === 'string' ? price : price?.id) === priceId &&
        line.period.start <= item.current_period_start &&
        line.period.end >= item.current_period_end
      )
    })
  const active = subscription.status === 'active' && !subscription.pause_collection
  const eligibleItem = !!item && item.quantity === 1 && item.price.recurring?.interval === 'month' && item.price.recurring.interval_count === 1
  const sameSubscription = previous.stripeSubscriptionId === subscription.id
  const periodStart = item ? new Date(item.current_period_start * 1000) : previous.currentPeriodStart
  const periodEnd = item ? new Date(item.current_period_end * 1000) : previous.currentPeriodEnd
  const validPeriod = Number.isFinite(periodStart.getTime()) && periodEnd > periodStart
  // A renewal invoice can exist before payment. Do not extend the paid period or reset bumps until it is paid.
  const acceptPeriod = eligibleItem && active && paid && validPeriod
  const status: Subscription['status'] =
    subscription.status === 'past_due' || subscription.status === 'unpaid'
      ? 'PAST_DUE'
      : eligibleItem && active && (acceptPeriod || sameSubscription)
        ? subscription.cancel_at_period_end || subscription.cancel_at !== null
          ? 'CANCELED'
          : 'ACTIVE'
        : 'EXPIRED'

  return {
    stripeSubscriptionId: subscription.id,
    plan: eligibleItem ? ('PRO' as const) : ('FREE' as const),
    status,
    currentPeriodStart: acceptPeriod ? periodStart : sameSubscription ? previous.currentPeriodStart : new Date(0),
    currentPeriodEnd: acceptPeriod ? periodEnd : sameSubscription ? previous.currentPeriodEnd : new Date(0),
    bumpUsed: acceptPeriod && (!sameSubscription || periodStart > previous.currentPeriodStart) ? 0 : previous.bumpUsed
  }
}

export function isSafePortalConfiguration(configuration: Stripe.BillingPortal.Configuration) {
  const features = configuration.features
  return (
    configuration.active &&
    features.payment_method_update.enabled &&
    features.customer_update.enabled &&
    features.customer_update.allowed_updates.includes('address') &&
    features.subscription_cancel.enabled &&
    features.subscription_cancel.mode === 'at_period_end' &&
    !features.subscription_update.enabled
  )
}
