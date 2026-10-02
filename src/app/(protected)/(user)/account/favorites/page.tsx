import { ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { getMyFavorites } from '@/features/favorites/data'
import { serializePagination } from '@/lib/pagination'
import NuqsPagination from '@/shared/ui/NuqsPagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const favoritesGridClassName = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'

async function FavoriteListings({ searchParams }: Props) {
  const params = await searchParams
  const { listings, page, pageSize, totalItems, totalPages } = await getMyFavorites(params.page)

  // Normalize invalid/out-of-range URLs, also after removing the final card on a page.
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(`/account/favorites${serializePagination(query, { page })}`)
  }

  if (!listings.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <Heart aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">You don&apos;t have any favorite listings yet</h3>
        <p className="text-muted-foreground max-w-sm text-sm">Save listings you like and return to them here.</p>
        <Button nativeButton={false} render={<Link href="/#listings" />}>
          Browse listings <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <p role="status" className="text-muted-foreground text-sm">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} favorites
      </p>
      <div className={favoritesGridClassName}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isFavorited
            isAuthenticated
            imageSizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc((100vw - 64px) / 2), calc((100vw - 336px) / 3)"
          />
        ))}
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel="Favorites pages" />
    </>
  )
}

function FavoritesLoading() {
  return (
    <div role="status" aria-label="Loading your favorites" className={favoritesGridClassName}>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-80 rounded-2xl" />
      ))}
      <span className="sr-only">Loading your favorites...</span>
    </div>
  )
}

export default function FavoritesPage({ searchParams }: Props) {
  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="favorites-heading" className="text-2xl font-semibold">
          Favorites
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Your saved listings, with the most recently added first. Only available listings are shown.
        </p>
      </div>
      <Suspense fallback={<FavoritesLoading />}>
        <FavoriteListings searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
