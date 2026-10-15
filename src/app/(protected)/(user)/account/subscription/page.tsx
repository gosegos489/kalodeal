import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccount } from '@/features/account/data'
import { BillingButton } from '@/features/billing/billing-button'
import { CheckoutPending } from '@/features/billing/checkout-pending'
import { getBillingAvailability } from '@/features/billing/config'
import { PlanComparison } from '@/features/billing/plan-comparison'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import AccountLoading from '../loading'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountSubscription({ searchParams }: Props) {
  const account = await getAccount()
  const params = await searchParams
  const available = await getBillingAvailability()

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
            <h2>My plan</h2>
          </CardTitle>
          <CardDescription>
            {account.plan !== 'FREE'
              ? 'For active sellers. List more items and track buyer interest.'
              : 'For occasional sellers. Start with the essentials.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <Badge>{account.limits.name} plan</Badge>
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
              <dt className="text-muted-foreground text-sm">Listing analytics</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.analyticsLevel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Monthly listing boosts</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.monthlyBoosts > 0 ? (
                  <>
                    {account.monthlyBoosts} total{' '}
                    <span className="text-muted-foreground text-sm">
                      · {account.planBoostsUsed} used · {account.planBoostsRemaining} remaining
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm font-normal">Available on paid plans</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Bonus boosts</dt>
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
                <dt className="text-muted-foreground text-sm">Status</dt>
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
          {account.subscription?.hasStripeSubscription && <BillingButton intent="manage" />}
          {account.limits.analyticsLevel !== 'none' && (
            <Button nativeButton={false} variant="outline" render={<Link href="/account/analytics" />}>
              Analytics
            </Button>
          )}
        </CardContent>
      </Card>
      <Button nativeButton={false} variant="outline" render={<Link href="/pricing" />}>
        Compare all plans
      </Button>
      <PlanComparison
        currentPlan={account.plan}
        paidPlan={account.paidPlan}
        available={available}
        hasSubscription={!!account.subscription?.hasStripeSubscription && account.subscription.status !== 'EXPIRED'}
      />
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
