import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { stripe } from '@/lib/stripe'
import { getSubscriptionInvoiceSnapshot, hasStripePaymentProof } from './payment-state'

export async function recordSubscriptionPayment(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  userId: string,
  customerId: string,
  priceId: string,
  livemode: boolean
) {
  const existing = await tx.subscriptionPayment.findUnique({ where: { stripeInvoiceId: invoiceId }, select: { userId: true } })
  if (existing) {
    if (existing.userId !== userId) throw new Error('Payment ownership mismatch.')
    return
  }

  // Read the event's invoice, not latest_invoice: delayed initial/renewal events are
  // separate payments even when the customer's subscription has since changed.
  const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['amount_paid_off_stripe'] })
  if (invoice.id !== invoiceId || invoice.livemode !== livemode) throw new Error('Invoice identity or mode mismatch.')
  if (invoice.amount_paid_off_stripe === undefined) throw new Error('Invoice payment provenance is unavailable.')
  if (invoice.lines.has_more) {
    invoice.lines = await stripe.invoices.listLineItems(invoiceId, { limit: 100 })
    if (invoice.lines.has_more) throw new Error('Too many invoice lines to verify safely.')
  }
  const snapshot = getSubscriptionInvoiceSnapshot(invoice, customerId, priceId, livemode)
  if (!snapshot) return

  const payments = await stripe.invoicePayments.list({
    invoice: invoice.id,
    status: 'paid',
    limit: 100,
    expand: ['data.payment.payment_intent.latest_charge', 'data.payment.charge']
  })
  if (payments.has_more) throw new Error('Too many invoice payments to verify safely.')
  if (!hasStripePaymentProof(invoice, payments.data)) return

  // The unique invoice constraint also protects against different event IDs for
  // the same invoice. Never update a saved receipt snapshot on later deliveries.
  await tx.subscriptionPayment.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: { ...snapshot, userId },
    update: {}
  })
}
