import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountPlanSkeleton } from '@/features/account/account-skeleton'
import { getAccount } from '@/features/account/data'
import { BillingButton } from '@/features/billing/billing-button'
import { CheckoutPending } from '@/features/billing/checkout-pending'
import { formatPlanPrice } from '@/lib/plan-limits'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountSubscription({ searchParams }: Props) {
  const account = await getAccount()
  const params = await searchParams

  return (
    <div className="flex flex-col gap-6">
      <RouteAutoRefresh />
      {params.checkout === 'success' && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3" role="status">
            {account.paidPlan !== 'FREE' ? <p>Your paid plan is active.</p> : <CheckoutPending />}
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
            <h2>Current plan</h2>
          </CardTitle>
          <CardDescription>Your current benefits and usage. Compare selling plans on the pricing page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <Badge>{account.limits.name} plan</Badge>
          <p className="text-2xl font-semibold">
            {account.plan === 'FREE' ? (
              <span className="text-muted-foreground text-base font-normal">No subscription required</span>
            ) : account.plan !== account.paidPlan ? (
              <span className="text-muted-foreground text-base font-normal">Complimentary Pro access</span>
            ) : (
              <>
                {formatPlanPrice(account.plan)}
                <span className="text-muted-foreground text-sm font-normal"> / month · standard plan price</span>
              </>
            )}
          </p>
          <dl className="grid w-full gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Active listing allowance</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.listingSlotCount} / {account.limits.activeListings}
                <p className="text-muted-foreground mt-1 text-xs font-normal">Includes pending listings and requested corrections.</p>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Photos per listing</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.imagesPerListing}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Listing analytics</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.limits.analyticsLevel === 'none' ? 'Not included' : account.limits.analyticsLevel === 'basic' ? 'Basic' : 'Advanced'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Monthly Boosts</dt>
              <dd className="mt-1 text-lg font-semibold">{account.monthlyBoosts}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Remaining monthly Boosts</dt>
              <dd className="mt-1 text-lg font-semibold">{account.planBoostsRemaining}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Bonus Boosts</dt>
              <dd className="mt-1 text-lg font-semibold">{account.bonusBoostsRemaining} remaining</dd>
            </div>
            {account.boostPeriodEndsAt && (
              <div>
                <dt className="text-muted-foreground text-sm">Current plan boost window ends</dt>
                <dd className="mt-1 font-medium">
                  {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(account.boostPeriodEndsAt)} UTC
                </dd>
              </div>
            )}
            {account.limits.featuredSlots > 0 && (
              <div>
                <dt className="text-muted-foreground text-sm">Featured Listing slots</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {account.featuredUsed} / {account.limits.featuredSlots} used · {Math.max(0, account.limits.featuredSlots - account.featuredUsed)}{' '}
                  remaining
                </dd>
              </div>
            )}
          </dl>
          {account.listingSlotCount > account.limits.activeListings && (
            <p role="status" className="text-muted-foreground text-sm">
              Your account is over the current listing limit. The oldest reserved slots remain eligible for publication. Excess listings are visible
              only to you; hide other listings or upgrade to make room. Listings and photos are retained.
            </p>
          )}
          {account.complimentaryGrant && (
            <div className="bg-muted w-full rounded-lg p-4" role="status">
              <p className="font-medium">Complimentary Pro access</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Available until{' '}
                <time dateTime={account.complimentaryGrant.endsAt.toISOString()}>
                  {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(
                    account.complimentaryGrant.endsAt
                  )}{' '}
                  UTC
                </time>
                . Complimentary boosts renew every 30 days during this access, without carryover.
                {account.planBoostSource === 'paid' && ' Your paid subscription supplies the plan boost allowance while it is active.'}
              </p>
            </div>
          )}
          {account.subscription?.hasStripeSubscription && (
            <dl className="grid w-full gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Subscription status</dt>
                <dd className="mt-1 font-medium">
                  {['past_due', 'unpaid'].includes(account.subscription.stripeStatus ?? '')
                    ? 'Payment past due'
                    : account.paidPlan !== 'FREE'
                      ? account.subscription.status === 'CANCELED'
                        ? 'Canceling'
                        : 'Active'
                      : account.subscription.status === 'PAST_DUE'
                        ? 'Payment past due'
                        : account.subscription.currentPeriodEnd.getTime() > 0
                          ? 'Expired'
                          : 'Awaiting payment'}
                </dd>
              </div>
              {account.subscription.currentPeriodEnd.getTime() > 0 && (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {account.paidPlan !== 'FREE'
                      ? account.subscription.status === 'CANCELED'
                        ? 'Access remains active until'
                        : 'Renews on'
                      : 'Paid period ends'}
                  </dt>
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
          {account.paidPlan !== 'FREE' && account.subscription?.status === 'CANCELED' && (
            <p className="text-muted-foreground text-sm">
              Your paid plan remains available until the paid period ends. Your subscription will not renew.
            </p>
          )}
          {account.subscription?.hasStripeSubscription && (
            <p className="text-muted-foreground text-sm">
              Your current billing amount and any scheduled plan change are shown in Stripe billing. Existing subscription prices are retained.
            </p>
          )}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal" render={<Link href="/pricing" />}>
              View all plans
            </Button>
            {account.subscription?.hasStripeSubscription && <BillingButton intent="manage" />}
            {account.limits.analyticsLevel !== 'none' && (
              <Button nativeButton={false} className="h-auto min-h-11 px-4 py-3" variant="outline" render={<Link href="/account/analytics" />}>
                Analytics
              </Button>
            )}
          </div>
          {account.subscription?.hasStripeSubscription && (
            <p className="text-muted-foreground text-sm">Manage payment details, plan changes and cancellation in subscription billing.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AccountPlanSkeleton />}>
      <AccountSubscription searchParams={searchParams} />
    </Suspense>
  )
}
