import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { BillingButton } from './billing-button'

type PlanComparisonProps = { currentPlan: ListingPlan; price: string | null }

export function PlanComparison({ currentPlan, price }: PlanComparisonProps) {
  const free = PLAN_LIMITS.FREE
  const pro = PLAN_LIMITS.PRO
  const features = [
    { label: 'Active listings', free: free.activeListings, pro: pro.activeListings },
    { label: 'Photos per listing', free: free.imagesPerListing, pro: pro.imagesPerListing },
    { label: 'Monthly bumps', free: free.monthlyBumps, pro: pro.monthlyBumps },
    { label: 'Advanced analytics', free: free.advancedStats ? 'Yes' : 'No', pro: pro.advancedStats ? 'Yes' : 'No' }
  ]

  return (
    <section aria-labelledby="plan-comparison-heading" className="flex min-w-0 flex-col gap-4">
      <h2 id="plan-comparison-heading" className="text-xl font-semibold">
        Choose the plan that fits how you sell
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <h3>Free</h3>
              {currentPlan === 'FREE' && <Badge variant="outline">Your plan</Badge>}
            </CardTitle>
            <CardDescription>For occasional sellers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-semibold">No subscription required</p>
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>
                {free.activeListings} active listing{free.activeListings === 1 ? '' : 's'}
              </li>
              <li>{free.imagesPerListing} photos per listing</li>
              <li>Standard listing placement</li>
              <li>Basic account tools</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="ring-primary/40">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <h3>Pro</h3>
              {currentPlan === 'PRO' && <Badge>Your plan</Badge>}
            </CardTitle>
            <CardDescription>For active sellers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-5">
            <p className="text-2xl font-semibold">
              {price ?? 'Monthly membership'}
              {price && <span className="text-muted-foreground text-sm font-normal"> / month</span>}
            </p>
            <ul className="w-full space-y-4 text-sm">
              <li>
                <p className="font-medium">{pro.activeListings} active listings</p>
                <p className="text-muted-foreground mt-1">List more items at the same time.</p>
              </li>
              <li>
                <p className="font-medium">{pro.imagesPerListing} photos per listing</p>
                <p className="text-muted-foreground mt-1">Give buyers a better view of what you&apos;re selling.</p>
              </li>
              <li>
                <p className="font-medium">{pro.monthlyBumps} listing bumps every month</p>
                <p className="text-muted-foreground mt-1">Move your active listings back toward the top of search results.</p>
              </li>
              {pro.advancedStats && (
                <li>
                  <p className="font-medium">Advanced listing analytics</p>
                  <p className="text-muted-foreground mt-1">Track views, favorites and phone reveals to see which listings attract interest.</p>
                </li>
              )}
            </ul>
            {currentPlan === 'FREE' &&
              (price ? (
                <BillingButton intent="upgrade" upgradeLabel={`Upgrade to Pro — ${price}/month`} />
              ) : (
                <p className="text-muted-foreground text-sm">Upgrades are temporarily unavailable. Please try again later.</p>
              ))}
            <p className="text-muted-foreground text-xs leading-relaxed">
              Cancel anytime. Your Pro features remain active until the end of the current billing period.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Plans at a glance</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Compare Free and Pro plan limits</caption>
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th scope="col" className="py-3 pr-3">
                    Feature
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Free
                  </th>
                  <th scope="col" className="py-3 pl-3 text-center">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.label} className="border-b last:border-b-0">
                    <th scope="row" className="py-3 pr-3 font-medium">
                      {feature.label}
                    </th>
                    <td className="px-3 py-3 text-center tabular-nums">{feature.free}</td>
                    <td className="py-3 pl-3 text-center tabular-nums">{feature.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Listings awaiting moderation also count toward your listing limit. Bumps apply to active listings and renew each paid billing period;
            unused bumps do not carry over.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
