import z from 'zod'

export const subscriptionPaymentIdSchema = z.string().regex(/^c[a-z0-9]{24}$/)

export const paymentInvoiceRequestSchema = z.object({
  paymentId: subscriptionPaymentIdSchema,
  action: z.enum(['view', 'pdf'])
})

export const stripeInvoiceUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['invoice.stripe.com', 'pay.stripe.com'].includes(url.hostname)
  } catch {
    return false
  }
})
