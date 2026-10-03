'use server'

import 'server-only'
import { getStripeLiveMode } from '@/features/billing/config'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionResult } from '@/lib/action-result'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { paymentInvoiceRequestSchema, stripeInvoiceUrlSchema } from './schema'

export async function getPaymentInvoiceUrl(input: unknown): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to access your invoice.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }

    const parsed = paymentInvoiceRequestSchema.safeParse(input)
    if (!parsed.success) return { success: false, message: 'Invoice not found.' }

    // Only resolve Stripe IDs from an owned, verified local payment record.
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { id: parsed.data.paymentId, userId: session.user.id, status: 'PAID', amount: { gt: 0 } },
      select: { stripeInvoiceId: true, stripeSubscriptionId: true }
    })
    if (!payment) return { success: false, message: 'Invoice not found.' }

    const invoice = await stripe.invoices.retrieve(payment.stripeInvoiceId)
    const subscription = invoice.parent?.subscription_details?.subscription
    const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id
    if (invoice.id !== payment.stripeInvoiceId || subscriptionId !== payment.stripeSubscriptionId || invoice.livemode !== getStripeLiveMode()) {
      throw new Error('Invoice identity mismatch.')
    }
    if (invoice.status === 'draft' || !invoice.status_transitions.finalized_at) {
      return { success: false, message: 'This invoice has not been finalized yet. Please try again later.' }
    }
    if (invoice.status !== 'paid') return { success: false, message: 'The paid invoice is currently unavailable. Please try again later.' }

    const url = parsed.data.action === 'view' ? invoice.hosted_invoice_url : invoice.invoice_pdf
    if (!url) {
      return {
        success: false,
        message:
          parsed.data.action === 'view'
            ? 'The invoice page is not available yet. Please try again later.'
            : 'The invoice PDF is not available yet. Please try again later.'
      }
    }
    const safeUrl = stripeInvoiceUrlSchema.safeParse(url)
    if (!safeUrl.success) throw new Error('Invalid Stripe invoice URL.')

    return { success: true, data: { url: safeUrl.data } }
  } catch {
    console.error('Could not retrieve payment invoice.')
    return { success: false, message: 'Invoices are temporarily unavailable. Please try again.' }
  }
}
