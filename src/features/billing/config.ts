import 'server-only'
import { PAID_PLANS, PLAN_LIMITS, type PaidPlan } from '@/lib/plan-limits'
import { getStripe } from '@/lib/stripe'
import { isSafePortalConfiguration } from './subscription-state'

const priceVariables = { PLUS: 'STRIPE_PLUS_PRICE_ID', PRO: 'STRIPE_PRO_PRICE_ID', BUSINESS: 'STRIPE_BUSINESS_PRICE_ID' } as const

export function getPlanPriceId(plan: PaidPlan) {
  const id = process.env[priceVariables[plan]]
  if (!id || !/^price_[A-Za-z0-9]+$/.test(id)) throw new Error(`${plan} price is not configured.`)
  return id
}

// Explicit compatibility for deployed Pro subscriptions. Never modify their prices.
export function getRecognizedPrices(): Partial<Record<string, PaidPlan>> {
  const prices: Partial<Record<string, PaidPlan>> = {}
  function add(id: string, plan: PaidPlan) {
    if (!/^price_[A-Za-z0-9]+$/.test(id) || (prices[id] && prices[id] !== plan)) throw new Error('Invalid or ambiguous Stripe price configuration.')
    prices[id] = plan
  }
  for (const plan of PAID_PLANS) {
    const id = process.env[priceVariables[plan]]
    if (id) add(id, plan)
  }
  for (const id of (process.env.STRIPE_LEGACY_PRO_PRICE_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean))
    add(id, 'PRO')
  if (!Object.keys(prices).length) throw new Error('No Stripe prices are configured.')
  return prices
}

export function getBillingOrigin() {
  const origin = new URL(process.env.DOMAIN_URL ?? '')
  if (origin.username || origin.password || !['http:', 'https:'].includes(origin.protocol)) throw new Error('Invalid billing origin.')
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new Error('Billing requires HTTPS in production.')
  return origin.origin
}

export function getStripeLiveMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  if (/^(sk|rk)_live_/.test(key)) return true
  if (/^(sk|rk)_test_/.test(key)) return false
  throw new Error('Stripe mode is not configured.')
}

export async function getPlanPrice(plan: PaidPlan) {
  getRecognizedPrices()
  const price = await getStripe().prices.retrieve(getPlanPriceId(plan))
  if (
    !price.active ||
    price.livemode !== getStripeLiveMode() ||
    price.type !== 'recurring' ||
    price.recurring?.interval !== 'month' ||
    price.recurring.interval_count !== 1 ||
    price.recurring.usage_type !== 'licensed' ||
    price.currency !== 'eur' ||
    price.unit_amount !== PLAN_LIMITS[plan].price
  )
    throw new Error('The configured monthly price does not match this plan.')
  return price
}

export async function getPortalConfiguration() {
  const prices = getRecognizedPrices()
  const configurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID
  if (configurationId) {
    const configuration = await getStripe().billingPortal.configurations.retrieve(configurationId)
    return configuration.livemode === getStripeLiveMode() && isSafePortalConfiguration(configuration, prices) ? configuration : null
  }
  for await (const configuration of getStripe().billingPortal.configurations.list({ is_default: true, limit: 1 })) {
    const full = await getStripe().billingPortal.configurations.retrieve(configuration.id)
    if (full.livemode === getStripeLiveMode() && isSafePortalConfiguration(full, prices)) return full
  }
  return null
}

export async function getBillingAvailability() {
  const results = await Promise.all(
    PAID_PLANS.map(async (plan) => {
      try {
        await getPlanPrice(plan)
        return [plan, true] as const
      } catch {
        return [plan, false] as const
      }
    })
  )
  return Object.fromEntries(results)
}
