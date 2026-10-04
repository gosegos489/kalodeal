import { revalidatePath } from 'next/cache'
import type Stripe from 'stripe'
import { getStripeLiveMode } from '@/features/billing/config'
import { BILLING_EVENTS, reconcileBillingEvent } from '@/features/billing/webhook'
import { captureServerException } from '@/lib/sentry-server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret) return Response.json({ error: 'Webhook is not configured.' }, { status: 503 })
  if (!signature) return Response.json({ error: 'Invalid signature.' }, { status: 400 })

  let event: Stripe.Event
  try {
    // The effective deployment environment provides ONE secret; do not try local and deployed secrets interchangeably.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
    if (event.livemode !== getStripeLiveMode()) return Response.json({ error: 'Invalid event mode.' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }
  if (!BILLING_EVENTS.has(event.type)) return Response.json({ received: true })

  try {
    await reconcileBillingEvent(event)
    // Also run on retries: a previous delivery may have committed before revalidation failed.
    revalidatePath('/account', 'layout')
    revalidatePath('/sell')
    return Response.json({ received: true })
  } catch (error) {
    await captureServerException(error, { feature: 'stripe-webhook', operation: 'reconcile', eventId: event.id, eventType: event.type })
    console.error('Stripe webhook reconciliation failed.')
    return Response.json({ error: 'Could not process event.' }, { status: 500 })
  }
}
