import 'server-only'
import Stripe from 'stripe'

// Keep Stripe calls bounded, including calls serialized by the billing user-row lock.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { timeout: 10000, maxNetworkRetries: 0 })
