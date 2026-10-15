import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getListings } from '@/entities/listing/get-listings'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { getFavoriteState } from '@/features/favorites/data'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export async function HomeListings({ searchParams }: HomePageProps) {
  const { filters, category, location, invalidFilters } = await getBrowseContext(searchParams)
  const listings = invalidFilters ? [] : await getListings(filters)
  const favoriteState = await getFavoriteState(listings.map(({ id }) => id))
  const filtered = Boolean(filters.query || filters.category || filters.district || invalidFilters)
  const title = filters.query
    ? `Results for “${filters.query}”`
    : filters.category
      ? `Listings in ${category?.category.name || filters.category.replaceAll('-', ' ')}`
      : location
        ? `Listings in ${location}`
        : invalidFilters
          ? 'Check your search filters'
          : 'Fresh on Kalodeal'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="listings-heading" className="text-xl font-semibold sm:text-2xl">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered
              ? `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} shown`
              : 'Discover the latest listings from our community.'}
          </p>
          {location && (filters.query || filters.category) && <p className="text-muted-foreground mt-1 text-sm">{location}</p>}
        </div>
        {filtered && (
          <Button nativeButton={false} variant="outline" render={<Link href="/" scroll={false} />}>
            Clear filters
          </Button>
        )}
      </div>
      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              eager={index === 0}
              prefetch={false}
              imageSizes="(min-width: 1536px) 364px, (min-width: 1280px) 300px, (min-width: 1024px) 320px, (min-width: 768px) 235px, (min-width: 640px) 296px, calc(100vw - 32px)"
              isFavorited={favoriteState.favoritedIds.has(listing.id)}
              isAuthenticated={favoriteState.isAuthenticated}
              showFavorite={favoriteState.canUseMarketplace}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
          <Search aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold">{filtered ? 'No listings match your search' : 'Be the first to share a great find'}</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            {invalidFilters
              ? 'Some search filters are invalid. Choose a district and an area within it, or clear the filters.'
              : filtered
                ? 'Try a different keyword, category or location.'
                : 'Give something you no longer need a new home.'}
          </p>
          {filtered ? (
            <Button nativeButton={false} variant="outline" render={<Link href="/" scroll={false} />}>
              Browse all listings <ArrowRight />
            </Button>
          ) : favoriteState.canUseMarketplace ? (
            <Link href="/sell" className="text-primary text-sm font-medium underline underline-offset-4">
              Post a listing
            </Link>
          ) : (
            <Link href="/moderator" className="text-primary text-sm underline">
              Open moderator panel
            </Link>
          )}
        </div>
      )}
    </>
  )
}
