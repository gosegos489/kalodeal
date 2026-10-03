import NuqsPagination from '@/shared/ui/NuqsPagination'
import { getListingModerationQueue } from './data'
import { ModerationListingRow } from './moderation-listing-row'
import { ModerationSearch } from './moderation-search'
import type { ModerationSearchParams } from './search'

export async function ListingModerationQueue(params: ModerationSearchParams) {
  const { listings, page: currentPage, pageSize, totalItems, totalPages } = await getListingModerationQueue(params)

  return (
    <section aria-labelledby="listing-moderation-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="listing-moderation-heading" className="text-2xl font-semibold">
          Listing moderation
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Review pending listings, oldest content updates first.</p>
      </div>
      <ModerationSearch kind="listings" />
      {listings.length ? (
        <>
          <p role="status" className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} listings
          </p>
          <div className="flex min-w-0 flex-col gap-4">
            {listings.map((listing) => (
              <ModerationListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      ) : (
        <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No listings found.</p>
      )}
      <NuqsPagination totalPages={totalPages} ariaLabel="Listing moderation pages" />
    </section>
  )
}
