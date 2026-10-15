import 'server-only'
import Stripe from 'stripe'

let client: Stripe | undefined

// Public pricing can render when billing is unconfigured; callers handle the error.
// Keep calls bounded, including calls serialized by the billing user-row lock.
export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Stripe is not configured.')
    client = new Stripe(key, { timeout: 10000, maxNetworkRetries: 0 })
  }
  return client
}
