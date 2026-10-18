import { createHmac, timingSafeEqual } from 'node:crypto'
import type Stripe from 'stripe'
import z from 'zod'
import { LISTING_PLANS, type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'

const quoteSchema = z.object({
  userId: z.string(),
  subscriptionId: z.string(),
  itemId: z.string(),
  oldPriceId: z.string(),
  priceId: z.string().nullable(),
  plan: z.enum(LISTING_PLANS),
  from: z.enum(LISTING_PLANS),
  kind: z.enum(['upgrade', 'downgrade', 'cancel', 'keep']),
  periodStart: z.number().int(),
  periodEnd: z.number().int(),
  scheduleId: z.string().nullable(),
  pendingInvoiceId: z.string().nullable(),
  prorationDate: z.number().int(),
  amountDue: z.number().int().nonnegative(),
  currency: z.literal('eur'),
  issuedAt: z.number().int(),
  nonce: z.string().uuid()
})

export type PlanChangeQuote = z.infer<typeof quoteSchema>
export type PlanChangePreview = Pick<PlanChangeQuote, 'plan' | 'from' | 'kind' | 'amountDue' | 'currency'> & {
  effectiveAt: string
  renewsAt: string
  token: string
}

export function getPlanChangeKind(from: ListingPlan, to: ListingPlan): PlanChangeQuote['kind'] {
  return to === 'FREE' ? 'cancel' : from === to ? 'keep' : PLAN_LIMITS[to].price > PLAN_LIMITS[from].price ? 'upgrade' : 'downgrade'
}

// Quotes bind confirmation to the owner and the exact preview, without a DB table or client-authoritative amounts.
export function signPlanChangeQuote(quote: PlanChangeQuote, secret: string) {
  const payload = Buffer.from(JSON.stringify(quote)).toString('base64url')
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}

export function readPlanChangeQuote(token: string, secret: string, userId: string, now = Math.floor(Date.now() / 1000)) {
  if (token.length > 6000) throw new Error('Invalid billing quote.')
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) throw new Error('Invalid billing quote.')
  const actual = Buffer.from(signature, 'base64url')
  const expected = createHmac('sha256', secret).update(payload).digest()
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid billing quote.')
  const quote = quoteSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')))
  if (quote.userId !== userId || quote.issuedAt > now || now - quote.issuedAt > 300 || quote.periodEnd <= now)
    throw new Error('Expired billing quote.')
  return quote
}

export function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === 'string' ? value : (value?.id ?? null)
}

export function isAppDowngradeSchedule(schedule: Stripe.SubscriptionSchedule, subscriptionId: string) {
  return (
    stripeId(schedule.subscription) === subscriptionId &&
    schedule.status === 'active' &&
    schedule.end_behavior === 'release' &&
    schedule.metadata?.kalodeal_plan_change === 'downgrade'
  )
}

export function getDowngradePhases(
  schedule: Stripe.SubscriptionSchedule,
  item: Stripe.SubscriptionItem,
  priceId: string
): Stripe.SubscriptionScheduleUpdateParams.Phase[] {
  const phase = schedule.phases.find((phase) => phase.start_date === schedule.current_phase?.start_date)
  // Do not overwrite custom schedules, discounts, trials or one-off charges created outside this flow.
  if (
    !phase ||
    phase.items.length !== 1 ||
    stripeId(phase.items[0].price) !== item.price.id ||
    phase.items[0].quantity !== 1 ||
    phase.discounts.length ||
    phase.items[0].discounts.length ||
    phase.add_invoice_items.length ||
    phase.trial_end ||
    phase.application_fee_percent ||
    phase.transfer_data ||
    phase.on_behalf_of ||
    phase.automatic_tax?.liability?.type === 'account' ||
    phase.invoice_settings?.issuer?.type === 'account' ||
    phase.billing_thresholds ||
    phase.items[0].billing_thresholds ||
    phase.end_date < item.current_period_end
  )
    throw new Error('Unsupported subscription schedule.')
  const settings = {
    collection_method: 'charge_automatically' as const,
    ...(phase.automatic_tax ? { automatic_tax: { enabled: phase.automatic_tax.enabled } } : {}),
    ...(stripeId(phase.default_payment_method) ? { default_payment_method: stripeId(phase.default_payment_method) ?? undefined } : {}),
    ...(phase.default_tax_rates?.length ? { default_tax_rates: phase.default_tax_rates.map((rate) => rate.id) } : {}),
    ...(phase.description ? { description: phase.description } : {}),
    ...(phase.metadata ? { metadata: phase.metadata } : {}),
    ...(phase.invoice_settings
      ? {
          invoice_settings: {
            ...(phase.invoice_settings.account_tax_ids
              ? { account_tax_ids: phase.invoice_settings.account_tax_ids.map((tax) => stripeId(tax) ?? '') }
              : {}),
            ...(phase.invoice_settings.custom_fields ? { custom_fields: phase.invoice_settings.custom_fields } : {}),
            ...(phase.invoice_settings.description ? { description: phase.invoice_settings.description } : {}),
            ...(phase.invoice_settings.footer ? { footer: phase.invoice_settings.footer } : {})
          }
        }
      : {}),
    proration_behavior: 'none' as const
  }
  return [
    {
      ...settings,
      start_date: phase.start_date,
      end_date: item.current_period_end,
      items: [
        {
          price: item.price.id,
          quantity: 1,
          ...(phase.items[0].metadata ? { metadata: phase.items[0].metadata } : {}),
          ...(phase.items[0].tax_rates?.length ? { tax_rates: phase.items[0].tax_rates.map((rate) => rate.id) } : {})
        }
      ]
    },
    {
      ...settings,
      start_date: item.current_period_end,
      duration: { interval: 'month' as const, interval_count: 1 },
      items: [
        {
          price: priceId,
          quantity: 1,
          ...(phase.items[0].metadata ? { metadata: phase.items[0].metadata } : {}),
          ...(phase.items[0].tax_rates?.length ? { tax_rates: phase.items[0].tax_rates.map((rate) => rate.id) } : {})
        }
      ]
    }
  ] satisfies Stripe.SubscriptionScheduleUpdateParams.Phase[]
}
