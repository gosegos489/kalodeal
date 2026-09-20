import type { ListingPlan } from '@/lib/plan-limits'
import { ListingAllowanceCard } from './listing-allowance-card'
import { ListingTipsCard } from './listing-tips-card'
import { PublishListingCard } from './publish-listing-card'

type CreateListingSidebarProps = {
  plan: ListingPlan
  activeListingCount: number
  categoriesAvailable: boolean
  isSubmitting: boolean
  disabled: boolean
}

export function CreateListingSidebar({ plan, activeListingCount, categoriesAvailable, isSubmitting, disabled }: CreateListingSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24">
      <ListingAllowanceCard plan={plan} activeListingCount={activeListingCount} categoriesAvailable={categoriesAvailable} />
      <PublishListingCard isSubmitting={isSubmitting} disabled={disabled} />
      <ListingTipsCard />
    </aside>
  )
}
