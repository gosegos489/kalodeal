import type Stripe from 'stripe'

function getId(value: string | { id: string } | null | undefined) {
  return typeof value === 'string' ? value : value?.id
}

function isPositiveAmount(amount: number | null) {
  return amount !== null && Number.isSafeInteger(amount) && amount > 0 && amount <= 2147483647
}

export function getSubscriptionInvoiceSnapshot(invoice: Stripe.Invoice, customerId: string, priceId: string, livemode: boolean) {
  const subscriptionId = getId(invoice.parent?.subscription_details?.subscription)
  const paidAt = invoice.status_transitions.paid_at
  if (
    invoice.status !== 'paid' ||
    invoice.livemode !== livemode ||
    getId(invoice.customer) !== customerId ||
    !subscriptionId ||
    !['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason ?? '') ||
    !isPositiveAmount(invoice.total) ||
    !isPositiveAmount(invoice.amount_due) ||
    !isPositiveAmount(invoice.amount_paid) ||
    invoice.amount_remaining !== 0 ||
    invoice.amount_paid_off_stripe !== 0 ||
    !/^[a-z]{3}$/.test(invoice.currency) ||
    !paidAt ||
    paidAt <= 0 ||
    !Number.isSafeInteger(paidAt) ||
    !Number.isFinite(new Date(paidAt * 1000).getTime()) ||
    invoice.lines.has_more ||
    !invoice.lines.data.length ||
    !invoice.lines.data.every((line) => {
      const details = line.parent?.subscription_item_details
      return (
        getId(line.pricing?.price_details?.price) === priceId && details?.subscription === subscriptionId && !details.proration && line.quantity === 1
      )
    })
  )
    return null

  return {
    description: invoice.billing_reason === 'subscription_create' ? 'Kalodeal Pro subscription' : 'Kalodeal Pro subscription renewal',
    amount: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    paidAt: new Date(paidAt * 1000)
  }
}

// Invoice status alone also accepts out-of-band payments. Require captured Stripe funds
// allocated to this invoice, covering its entire paid amount, with matching ownership/mode.
export function hasStripePaymentProof(invoice: Stripe.Invoice, payments: Stripe.InvoicePayment[]) {
  if (!payments.length) return false
  const customerId = getId(invoice.customer)
  const paymentIds = new Set<string>()
  const allocations = new Map<string, number>()
  let total = 0

  for (const payment of payments) {
    if (
      paymentIds.has(payment.id) ||
      payment.status !== 'paid' ||
      payment.livemode !== invoice.livemode ||
      getId(payment.invoice) !== invoice.id ||
      payment.currency !== invoice.currency ||
      !isPositiveAmount(payment.amount_paid)
    )
      return false
    paymentIds.add(payment.id)
    // Narrow explicitly: null is not a successful allocation.
    const amount = payment.amount_paid
    if (amount === null) return false

    const intent = payment.payment.type === 'payment_intent' ? payment.payment.payment_intent : undefined
    if (
      intent &&
      (typeof intent === 'string' ||
        intent.status !== 'succeeded' ||
        intent.livemode !== invoice.livemode ||
        getId(intent.customer) !== customerId ||
        intent.currency !== invoice.currency ||
        !isPositiveAmount(intent.amount_received))
    )
      return false

    const charge =
      payment.payment.type === 'payment_intent' && intent && typeof intent !== 'string'
        ? intent.latest_charge
        : payment.payment.type === 'charge'
          ? payment.payment.charge
          : undefined
    if (
      !charge ||
      typeof charge === 'string' ||
      !charge.paid ||
      !charge.captured ||
      charge.status !== 'succeeded' ||
      charge.livemode !== invoice.livemode ||
      getId(charge.customer) !== customerId ||
      charge.currency !== invoice.currency ||
      !isPositiveAmount(charge.amount_captured) ||
      (intent && typeof intent !== 'string' && getId(charge.payment_intent) !== intent.id)
    )
      return false

    const allocated = (allocations.get(charge.id) ?? 0) + amount
    if (allocated > charge.amount_captured || (intent && typeof intent !== 'string' && allocated > intent.amount_received)) return false
    allocations.set(charge.id, allocated)
    total += amount
    if (!Number.isSafeInteger(total) || total > invoice.amount_paid) return false
  }

  return total === invoice.amount_paid
}
