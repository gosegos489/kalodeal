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
import AccountLoading from '../loading'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountSubscription({ searchParams }: Props) {
  const account = await getAccount()
  const params = await searchParams
  const billing = await getBillingAvailability()
  const price = billing.price
    ? new Intl.NumberFormat('en', { style: 'currency', currency: billing.price.currency }).format(billing.price.amount / 100)
    : null

  return (
    <div className="flex flex-col gap-6">
      {params.checkout === 'success' && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3" role="status">
            {account.plan === 'PRO' ? <p>Your Pro plan is active.</p> : <CheckoutPending />}
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
            {account.plan === 'PRO'
              ? 'For active sellers. List more items and track buyer interest.'
              : 'For occasional sellers. Start with the essentials.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <Badge>{account.plan === 'PRO' ? 'Pro plan' : 'Free plan'}</Badge>
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
              <dt className="text-muted-foreground text-sm">Advanced analytics</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.advancedStats ? 'Included' : 'Pro only'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Monthly listing bumps</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.plan === 'PRO' ? (
                  <>
                    {account.limits.monthlyBumps} total <span className="text-muted-foreground text-sm">· {account.bumpsRemaining} remaining</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm font-normal">Available with an active paid Pro period</span>
                )}
              </dd>
            </div>
          </dl>
          {account.subscription && (account.plan === 'PRO' || account.subscription.hasStripeSubscription) && (
            <dl className="grid w-full gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Status</dt>
                <dd className="mt-1 font-medium">
                  {account.plan === 'PRO'
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
                    {account.plan === 'PRO'
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
          {account.plan === 'PRO' && account.subscription?.status === 'CANCELED' && (
            <p className="text-muted-foreground text-sm">Pro remains available until the paid period ends. Your subscription will not renew.</p>
          )}
          {account.subscription?.hasStripeSubscription && <BillingButton intent="manage" />}
          {account.limits.advancedStats && (
            <Button nativeButton={false} variant="outline" render={<Link href="/account/analytics" />}>
              Analytics
            </Button>
          )}
        </CardContent>
      </Card>
      <PlanComparison currentPlan={account.plan} price={price} />
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
