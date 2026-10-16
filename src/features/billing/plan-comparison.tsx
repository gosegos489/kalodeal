import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LISTING_PLANS, type ListingPlan, PLAN_LIMITS, type PaidPlan, formatPlanPrice } from '@/lib/plan-limits'
import { cn } from '@/lib/utils'
import { BillingButton } from './billing-button'
import { pricingCtaClassName } from './pricing-cta'

type Props = {
  currentPlan: ListingPlan
  paidPlan: ListingPlan
  authenticated?: boolean
  marketplaceAllowed?: boolean
  hasSubscription?: boolean
  available: Partial<Record<ListingPlan, boolean>>
  selectedPlan?: PaidPlan
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
  available,
  selectedPlan
}: Props) {
  return (
    <section aria-label="Compare selling plans" className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {LISTING_PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan]
          const isCurrent = authenticated && currentPlan === plan
          const price = formatPlanPrice(plan)
          const isSelected = selectedPlan === plan
          return (
            <Card key={plan} className={cn('flex h-full flex-col', isSelected && 'ring-primary ring-2')}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <h2>{limits.name}</h2>
                  {isCurrent && <Badge variant="outline">Your plan</Badge>}
                  {isSelected && !isCurrent && <Badge variant="outline">Selected plan</Badge>}
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
                <div className="mt-auto flex w-full flex-col items-stretch gap-3 pt-2">
                  {!marketplaceAllowed ? (
                    <p className="text-muted-foreground text-sm">Selling plans are available to marketplace accounts.</p>
                  ) : plan !== 'FREE' && !available[plan] && paidPlan !== plan ? (
                    <div role="status" className="flex flex-col gap-2">
                      <Button disabled className={pricingCtaClassName}>
                        Currently unavailable
                      </Button>
                      <p className="sr-only">This plan is temporarily unavailable. Please try again later.</p>
                    </div>
                  ) : !authenticated ? (
                    <Button
                      nativeButton={false}
                      className={pricingCtaClassName}
                      render={<Link href={`/login?returnTo=${encodeURIComponent(plan === 'FREE' ? '/pricing' : `/pricing?plan=${plan}`)}`} />}
                    >
                      {plan === 'FREE' ? 'Get started free' : `Upgrade to ${limits.name} — ${price}/month`}
                    </Button>
                  ) : plan === 'FREE' ? (
                    currentPlan === 'FREE' ? (
                      <Button disabled className={pricingCtaClassName}>
                        Your plan
                      </Button>
                    ) : hasSubscription ? (
                      <BillingButton intent="manage" className={pricingCtaClassName} upgradeLabel="Switch to Free at period end" />
                    ) : (
                      <p className="text-muted-foreground text-sm">Free applies when complimentary access ends.</p>
                    )
                  ) : paidPlan === plan ? (
                    <Button disabled className={pricingCtaClassName}>
                      Your paid plan
                    </Button>
                  ) : hasSubscription ? (
                    <BillingButton intent="manage" className={pricingCtaClassName} upgradeLabel={`Change to ${limits.name}`} />
                  ) : available[plan] ? (
                    <BillingButton
                      intent="upgrade"
                      className={pricingCtaClassName}
                      plan={plan}
                      upgradeLabel={`${isSelected ? `Continue with ${limits.name}` : isCurrent ? `Start paid ${limits.name}` : `Upgrade to ${limits.name}`} — ${price}/month`}
                    />
                  ) : (
                    <Button disabled className={pricingCtaClassName}>
                      Currently unavailable
                    </Button>
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
