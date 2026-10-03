import { List, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAccount, getMyListings } from '@/features/account/data'
import { MyListingRow } from '@/features/account/my-listing-row'
import { serializePagination } from '@/lib/pagination'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import NuqsPagination from '@/shared/ui/NuqsPagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const listingsRowsClassName = 'flex min-w-0 flex-col gap-4'

async function MyListings({ searchParams }: Props) {
  const params = await searchParams
  const [{ listings, page, pageSize, totalItems, totalPages }, account] = await Promise.all([getMyListings(params.page), getAccount()])

  // Keep the URL aligned with the rendered page, also after the last row is deleted.
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(`/account/listings${serializePagination(query, { page })}`)
  }

  if (!listings.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <List aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">You don&apos;t have any listings yet</h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          Give something you no longer need a new home. Create your first listing to get started.
        </p>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus aria-hidden="true" /> Create your first listing
        </Button>
      </div>
    )
  }

  return (
    <>
      {account.limits.monthlyBumps > 0 ? (
        <p className="text-muted-foreground text-sm" role="status">
          Bumps remaining this period: {account.bumpsRemaining} / {account.limits.monthlyBumps}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Pro includes {PLAN_LIMITS.PRO.monthlyBumps} listing bumps each month to move your active listings toward the top of search results.{' '}
          <Link href="/account/subscription" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>
        </p>
      )}
      <p className="text-muted-foreground text-sm" role="status">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} listings
      </p>
      <div className={listingsRowsClassName}>
        {listings.map((listing) => (
          <MyListingRow key={listing.id} listing={listing} bumpsRemaining={account.bumpsRemaining} canBump={account.limits.monthlyBumps > 0} />
        ))}
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel="My listings pages" />
    </>
  )
}

function ListingsLoading() {
  return (
    <div role="status" aria-label="Loading your listings" className={listingsRowsClassName}>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl xl:h-24" />
      ))}
      <span className="sr-only">Loading your listings...</span>
    </div>
  )
}

export default function ListingsPage({ searchParams }: Props) {
  return (
    <section aria-labelledby="my-listings-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="my-listings-heading" className="text-2xl font-semibold">
            My listings
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">See your published listings and their current status.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus aria-hidden="true" /> Create listing
        </Button>
      </div>
      <Suspense fallback={<ListingsLoading />}>
        <MyListings searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
