import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LISTING_PLANS, type ListingPlan, PLAN_LIMITS, formatPlanPrice } from '@/lib/plan-limits'
import { BillingButton } from './billing-button'

type Props = {
  currentPlan: ListingPlan
  paidPlan: ListingPlan
  authenticated?: boolean
  marketplaceAllowed?: boolean
  hasSubscription?: boolean
  available: Partial<Record<ListingPlan, boolean>>
}
const descriptions = {
  FREE: 'For occasional sellers',
  PLUS: 'For regular sellers',
  PRO: 'For active sellers',
  BUSINESS: 'For businesses and professional sellers'
}

export function PlanComparison({
  currentPlan,
  paidPlan,
  authenticated = true,
  marketplaceAllowed = true,
  hasSubscription = false,
  available
}: Props) {
  return (
    <section aria-label="Compare selling plans" className="flex min-w-0 flex-col gap-6">
      <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {LISTING_PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan]
          const isCurrent = authenticated && currentPlan === plan
          const price = formatPlanPrice(plan)
          return (
            <Card key={plan} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <h2>{limits.name}</h2>
                  {isCurrent && <Badge variant="outline">Your plan</Badge>}
                </CardTitle>
                <CardDescription>{descriptions[plan]}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <p className="text-3xl font-semibold">
                  {price}
                  <span className="text-muted-foreground text-sm font-normal"> / month</span>
                </p>
                <ul className="flex flex-col gap-3 text-sm">
                  <li>
                    {limits.activeListings} active listing{limits.activeListings === 1 ? '' : 's'}
                  </li>
                  <li>{limits.imagesPerListing} photos per listing</li>
                  <li>Basic account tools</li>
                  <li>
                    {limits.monthlyBoosts
                      ? `${limits.monthlyBoosts} monthly Boosts per paid period`
                      : 'Standard listing placement · no monthly Boosts'}
                  </li>
                  <li>
                    {limits.analyticsLevel === 'none'
                      ? 'No paid listing analytics'
                      : limits.analyticsLevel === 'basic'
                        ? 'Basic analytics: views'
                        : 'Advanced analytics: views, favorites and phone reveals'}
                  </li>
                  {plan === 'FREE' && <li>No subscription required</li>}
                  {plan === 'BUSINESS' && (
                    <>
                      <li>Includes all Pro capabilities and regular monthly Boosts</li>
                      <li>Approved business name displayed on listings</li>
                      <li>{limits.featuredSlots} simultaneous Featured Listings</li>
                      <li>Persistent priority in relevant results while Business is active. No guaranteed first position.</li>
                    </>
                  )}
                </ul>
                <div className="mt-auto flex flex-col items-start gap-3 pt-2">
                  {!marketplaceAllowed ? (
                    <p className="text-muted-foreground text-sm">Selling plans are available to marketplace accounts.</p>
                  ) : !authenticated ? (
                    <Button nativeButton={false} className="h-auto whitespace-normal" render={<Link href="/login?returnTo=%2Fpricing" />}>
                      {plan === 'FREE' ? 'Get started free' : `Upgrade to ${limits.name} — ${price}/month`}
                    </Button>
                  ) : plan === 'FREE' ? (
                    currentPlan === 'FREE' ? (
                      <Button disabled>Your plan</Button>
                    ) : hasSubscription ? (
                      <BillingButton intent="manage" upgradeLabel="Switch to Free at period end" />
                    ) : (
                      <p className="text-muted-foreground text-sm">Free applies when complimentary access ends.</p>
                    )
                  ) : paidPlan === plan ? (
                    <Button disabled>Your paid plan</Button>
                  ) : hasSubscription ? (
                    <BillingButton intent="manage" upgradeLabel={`Change to ${limits.name}`} />
                  ) : available[plan] ? (
                    <BillingButton
                      intent="upgrade"
                      plan={plan}
                      upgradeLabel={`${isCurrent ? `Start paid ${limits.name}` : `Upgrade to ${limits.name}`} — ${price}/month`}
                    />
                  ) : (
                    <p role="status" className="text-muted-foreground text-sm">
                      Upgrades are temporarily unavailable.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Pending listings and requested corrections also reserve listing slots. Boost Listing raises one active listing once and uses one shared Boost.
        Unused monthly Boosts do not carry over; bonus Boosts retain their own expiry. Featured Listing is separate and does not use Boosts. Cancel
        through billing; paid benefits remain until the paid period ends.
      </p>
      {hasSubscription && (
        <p className="text-muted-foreground text-sm">
          Plan changes are reviewed in Stripe billing. Upgrades are invoiced with proration; downgrades and cancellation take effect at the end of the
          paid period. Available changes depend on billing configuration.
        </p>
      )}
    </section>
  )
}
