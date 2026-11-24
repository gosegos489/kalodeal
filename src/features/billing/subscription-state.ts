import type Stripe from 'stripe'
import type { Subscription } from '@/generated/prisma/client'
import { PLAN_LIMITS, type PaidPlan } from '@/lib/plan-limits'

type PreviousSubscription = Pick<Subscription, 'plan' | 'status' | 'stripeSubscriptionId' | 'currentPeriodStart' | 'currentPeriodEnd' | 'boostsUsed'>
export type RecognizedPrices = Partial<Record<string, PaidPlan>>

export function hasPlanPrice(subscription: Stripe.Subscription, prices: RecognizedPrices) {
  return subscription.items.data.some((item) => !!prices[item.price.id])
}
export function isOpenSubscription(subscription: { status: string }) {
  return subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired'
}

export function hasStripeSubscriptionToManage(
  subscription: { stripeSubscriptionId: string | null; stripeStatus: string | null; status: string } | null
) {
  return (
    !!subscription?.stripeSubscriptionId &&
    (subscription.stripeStatus ? isOpenSubscription({ status: subscription.stripeStatus }) : subscription.status !== 'EXPIRED')
  )
}

function isPaidInvoiceForSubscription(invoice: Stripe.Invoice, subscription: Stripe.Subscription) {
  const id = (value: string | { id: string } | null | undefined) => (typeof value === 'string' ? value : value?.id)
  return (
    invoice.status === 'paid' &&
    invoice.livemode === subscription.livemode &&
    id(invoice.customer) === id(subscription.customer) &&
    id(invoice.parent?.subscription_details?.subscription) === subscription.id &&
    !invoice.lines.has_more
  )
}

// An upgrade can finish before the initial purchase webhook arrives. Recover only a fully
// invoiced, paid base period from Stripe; a proration invoice alone cannot establish that period.
export function recoverPaidSubscriptionPeriod(
  subscription: Stripe.Subscription,
  previous: PreviousSubscription,
  prices: RecognizedPrices,
  invoices: Stripe.Invoice[],
  now = new Date()
): PreviousSubscription {
  const item = subscription.items.data.length === 1 && !subscription.items.has_more ? subscription.items.data[0] : undefined
  if (!item || !['active', 'past_due', 'unpaid'].includes(subscription.status) || subscription.pause_collection) return previous
  if (item.current_period_start * 1000 > now.getTime() || item.current_period_end * 1000 <= now.getTime()) return previous
  const plans = invoices
    .filter((invoice) => isPaidInvoiceForSubscription(invoice, subscription))
    .flatMap((invoice) =>
      invoice.lines.data.flatMap((line) => {
        const details = line.parent?.subscription_item_details
        const price = line.pricing?.price_details?.price
        const plan = prices[typeof price === 'string' ? price : (price?.id ?? '')]
        return plan &&
          details?.subscription === subscription.id &&
          details.subscription_item === item.id &&
          !details.proration &&
          line.quantity === 1 &&
          line.currency === item.price.currency &&
          line.period.start <= item.current_period_start &&
          line.period.end >= item.current_period_end
          ? [plan]
          : []
      })
    )
  const plan = plans.sort((a, b) => PLAN_LIMITS[b].price - PLAN_LIMITS[a].price)[0]
  if (!plan) return previous
  const samePeriod = previous.stripeSubscriptionId === subscription.id && previous.currentPeriodStart.getTime() === item.current_period_start * 1000
  return {
    plan,
    status: 'ACTIVE',
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    boostsUsed: samePeriod ? previous.boostsUsed : 0
  }
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
    isPaidInvoiceForSubscription(invoice, subscription) &&
    invoice.lines.data.some((line) => {
      const details = line.parent?.subscription_item_details
      const price = line.pricing?.price_details?.price
      if (
        details?.subscription !== subscription.id ||
        details.subscription_item !== item.id ||
        line.quantity !== 1 ||
        line.currency !== item.price.currency ||
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
        line.amount >= 0 &&
        previous.currentPeriodStart.getTime() === periodStart.getTime() &&
        previous.currentPeriodEnd.getTime() === periodEnd.getTime() &&
        line.period.start >= item.current_period_start &&
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

export function isSafePortalConfiguration(configuration: Stripe.BillingPortal.Configuration) {
  const features = configuration.features
  // Plan changes go through the app: the Portal cannot schedule cross-product downgrades.
  // A generic Portal session must not offer an immediate downgrade that bypasses that policy.
  return (
    configuration.active &&
    features.payment_method_update.enabled &&
    features.invoice_history.enabled &&
    features.customer_update.enabled &&
    features.customer_update.allowed_updates.includes('address') &&
    features.subscription_cancel.enabled &&
    features.subscription_cancel.mode === 'at_period_end' &&
    !features.subscription_update.enabled
  )
}
