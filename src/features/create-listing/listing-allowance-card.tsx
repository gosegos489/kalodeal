import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'

type ListingAllowanceCardProps = {
  plan: ListingPlan
  listingSlotCount: number
  categoriesAvailable: boolean
}

export function ListingAllowanceCard({ plan, listingSlotCount, categoriesAvailable }: ListingAllowanceCardProps) {
  const limits = PLAN_LIMITS[plan]
  const limitReached = listingSlotCount >= limits.activeListings
  const availableListingCount = limits.activeListings - listingSlotCount

  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Your listing allowance</h2>
        <span className="bg-primary/8 text-primary rounded-full px-3 py-1 text-xs font-semibold">{plan === 'PRO' ? 'Pro' : 'Free'}</span>
      </div>

      <div className="grid grid-cols-2 divide-x rounded-xl border py-4">
        <div className="flex flex-col gap-1 px-4">
          <p className="text-2xl font-semibold tabular-nums">
            {listingSlotCount}
            <span className="text-muted-foreground text-base font-normal"> / {limits.activeListings}</span>
          </p>
          <p className="text-muted-foreground text-xs">Used listing slots</p>
        </div>
        <div className="flex flex-col gap-1 px-4">
          <p className="text-2xl font-semibold tabular-nums">{limits.imagesPerListing}</p>
          <p className="text-muted-foreground text-xs">Photos per listing</p>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">Active listings and listings awaiting moderation count toward your limit.</p>

      <div className="flex flex-col gap-3 text-sm">
        {limitReached ? (
          <p className="text-destructive leading-relaxed">
            You have reached your listing limit, including listings awaiting moderation.{' '}
            <Link href="/account/listings" className="font-medium">
              Manage your listings
            </Link>{' '}
            or{' '}
            <Link href="/account/subscription" className="font-medium">
              view your plan
            </Link>
            .
          </p>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2">
            <Check className="text-primary size-4 shrink-0" /> {availableListingCount} listing {availableListingCount === 1 ? 'slot' : 'slots'}{' '}
            available
          </p>
        )}
        {!categoriesAvailable && <p className="text-destructive">Categories are currently unavailable. Please try again later.</p>}
      </div>

      <Link href="/account/subscription" className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
        {plan === 'PRO' ? 'Manage your plan' : 'Explore Pro'} <ArrowRight className="size-3.5" />
      </Link>
    </section>
  )
}
