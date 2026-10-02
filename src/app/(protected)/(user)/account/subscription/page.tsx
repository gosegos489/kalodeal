import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccount } from '@/features/account/data'
import { BillingButton, RefreshPlanButton } from '@/features/billing/billing-button'
import { getBillingAvailability } from '@/features/billing/config'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import AccountLoading from '../loading'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountSubscription({ searchParams }: Props) {
  const account = await getAccount()
  const params = await searchParams
  const billing = await getBillingAvailability(account.subscription?.hasStripeSubscription ?? false)
  const pro = PLAN_LIMITS.PRO
  const price = billing.price
    ? new Intl.NumberFormat('en', { style: 'currency', currency: billing.price.currency }).format(billing.price.amount / 100)
    : null

  return (
    <div className="flex flex-col gap-6">
      {params.checkout === 'success' && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3" role="status">
            <p>
              {account.plan === 'PRO'
                ? 'Your Pro plan is active.'
                : 'Payment confirmation is being processed. Your plan activates after Stripe confirms the subscription.'}
            </p>
            {account.plan !== 'PRO' && <RefreshPlanButton />}
          </CardContent>
        </Card>
      )}
      {params.checkout === 'canceled' && (
        <p role="status" className="text-muted-foreground text-sm">
          Checkout was canceled. Your current plan is shown below.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>My plan</h2>
          </CardTitle>
          <CardDescription>Your current publishing allowances.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <Badge>{account.plan === 'PRO' ? 'Pro' : 'Free'}</Badge>
          <dl className="grid w-full gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Used listing slots</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.listingSlotCount} / {account.limits.activeListings}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Photos per listing</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.imagesPerListing}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Analytics access</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.advancedStats ? 'Included' : 'Pro only'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Bumps per paid monthly period</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.limits.monthlyBumps} <span className="text-muted-foreground text-sm">({account.bumpsRemaining} remaining)</span>
              </dd>
            </div>
          </dl>
          {account.subscription && (account.plan === 'PRO' || account.subscription.hasStripeSubscription) && (
            <dl className="grid w-full gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Subscription status</dt>
                <dd className="mt-1 font-medium">
                  {account.subscription.status === 'CANCELED'
                    ? 'Cancellation scheduled'
                    : account.subscription.status === 'PAST_DUE'
                      ? 'Payment past due'
                      : account.subscription.status === 'EXPIRED'
                        ? 'Ended or awaiting payment'
                        : 'Active'}
                </dd>
              </div>
              {account.subscription.currentPeriodEnd.getTime() > 0 && (
                <div>
                  <dt className="text-muted-foreground text-sm">Paid period ends</dt>
                  <dd className="mt-1 font-medium">
                    <time dateTime={account.subscription.currentPeriodEnd.toISOString()}>
                      {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(
                        account.subscription.currentPeriodEnd
                      )}{' '}
                      UTC
                    </time>
                  </dd>
                </div>
              )}
            </dl>
          )}
          {account.plan === 'PRO' && account.subscription?.status === 'CANCELED' && (
            <p className="text-muted-foreground text-sm">Pro remains available until the paid period ends. Your subscription will not renew.</p>
          )}
          {account.subscription?.hasStripeSubscription &&
            (billing.portalAvailable ? (
              <BillingButton intent="manage" />
            ) : (
              <p className="text-muted-foreground text-sm">Subscription management is not available yet.</p>
            ))}
          {account.limits.advancedStats && (
            <Button nativeButton={false} variant="outline" render={<Link href="/account/analytics" />}>
              Analytics
            </Button>
          )}
        </CardContent>
      </Card>
      {account.plan === 'FREE' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Publish more with Pro</h2>
            </CardTitle>
            <CardDescription>{price ? `${price} per month` : 'Monthly Pro membership'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-5">
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>{pro.activeListings} listing slots</li>
              <li>Up to {pro.imagesPerListing} photos per listing</li>
              <li>{pro.monthlyBumps} bumps per paid monthly period</li>
              {pro.advancedStats && <li>Listing analytics: views, favorites and phone reveals</li>}
            </ul>
            {billing.price ? (
              <BillingButton intent="upgrade" />
            ) : (
              <p className="text-muted-foreground text-sm">Upgrades are temporarily unavailable. Please try again later.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SubscriptionPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountSubscription searchParams={searchParams} />
    </Suspense>
  )
}
