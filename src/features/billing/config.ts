import 'server-only'
import { stripe } from '@/lib/stripe'
import { isSafePortalConfiguration } from './subscription-state'

export function getProPriceId() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId || !/^price_[A-Za-z0-9]+$/.test(priceId)) throw new Error('PRO price is not configured.')
  return priceId
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

export async function getProPrice() {
  const price = await stripe.prices.retrieve(getProPriceId())
  if (
    !price.active ||
    price.livemode !== getStripeLiveMode() ||
    price.type !== 'recurring' ||
    price.recurring?.interval !== 'month' ||
    price.recurring.interval_count !== 1 ||
    price.recurring.usage_type !== 'licensed' ||
    price.unit_amount === null ||
    price.unit_amount <= 0
  )
    throw new Error('An active monthly PRO price is required.')
  return { ...price, unit_amount: price.unit_amount }
}

export async function getPortalConfiguration() {
  // Only inspect the Dashboard-managed default. Never create or update account settings.
  for await (const configuration of stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })) {
    if (configuration.livemode === getStripeLiveMode() && isSafePortalConfiguration(configuration)) return configuration
  }
  return null
}

export async function getBillingAvailability(hasStripeSubscription: boolean) {
  const [price, portal] = await Promise.allSettled([getProPrice(), hasStripeSubscription ? getPortalConfiguration() : Promise.resolve(null)])
  return {
    price: price.status === 'fulfilled' ? { amount: price.value.unit_amount, currency: price.value.currency } : null,
    portalAvailable: portal.status === 'fulfilled' && portal.value !== null
  }
}
