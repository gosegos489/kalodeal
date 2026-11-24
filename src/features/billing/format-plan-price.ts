import { getDisplayFormatter } from '@/i18n/formatter'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'

export function formatPlanPrice(plan: ListingPlan, locale: string) {
  // Plan prices remain integer minor units for Stripe; this conversion is display only.
  const { price, currency } = PLAN_LIMITS[plan]
  return getDisplayFormatter(locale).number(price / 100, 'currency', { currency })
}
