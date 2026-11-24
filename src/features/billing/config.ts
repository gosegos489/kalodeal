import 'server-only'
import { getAuthAllowedHosts } from '@/lib/auth-origins'
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

export function getBillingOrigin(requestOrigin?: string | null) {
  const preview = process.env.VERCEL_ENV === 'preview'
  const deploymentHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  const value = preview ? requestOrigin || (deploymentHost ? `https://${deploymentHost}` : process.env.DOMAIN_URL) : process.env.DOMAIN_URL
  const origin = new URL(value ?? '')
  if (origin.username || origin.password || !['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash)
    throw new Error('Invalid billing origin.')
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new Error('Billing requires HTTPS in production.')
  // Use the same project-bound host allowlist as authentication. Never return a Preview buyer to production,
  // even if DOMAIN_URL was accidentally inherited from the Production environment.
  if (preview && (origin.protocol !== 'https:' || !getAuthAllowedHosts(process.env).includes(origin.host) || origin.hostname === 'kalodeal.com'))
    throw new Error('Invalid Preview billing origin.')
  return origin.origin
}

export function getStripeLiveMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const live = /^(sk|rk)_live_/.test(key) ? true : /^(sk|rk)_test_/.test(key) ? false : null
  if (live === null) throw new Error('Stripe mode is not configured.')
  if ((process.env.VERCEL_ENV === 'preview' && live) || (process.env.VERCEL_ENV === 'production' && !live))
    throw new Error('Stripe mode does not match the deployment environment.')
  return live
}

export async function getPlanPrice(plan: PaidPlan) {
  getRecognizedPrices()
  const livemode = getStripeLiveMode()
  const id = getPlanPriceId(plan)
  const price = await getStripe().prices.retrieve(id)
  if (
    price.id !== id ||
    !price.active ||
    price.livemode !== livemode ||
    price.type !== 'recurring' ||
    price.billing_scheme !== 'per_unit' ||
    price.transform_quantity !== null ||
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
  const configurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID
  if (configurationId) {
    const configuration = await getStripe().billingPortal.configurations.retrieve(configurationId)
    return configuration.livemode === getStripeLiveMode() && isSafePortalConfiguration(configuration) ? configuration : null
  }
  for await (const configuration of getStripe().billingPortal.configurations.list({ is_default: true, limit: 1 })) {
    const full = await getStripe().billingPortal.configurations.retrieve(configuration.id)
    if (full.livemode === getStripeLiveMode() && isSafePortalConfiguration(full)) return full
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
