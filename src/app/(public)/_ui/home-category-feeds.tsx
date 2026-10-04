import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getMainCategoryFeeds } from '@/entities/listing/get-main-category-feeds'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { ListingCarousel } from '@/entities/listing/ui/listing-carousel'
import { getFavoriteState } from '@/features/favorites/data'

export async function HomeCategoryFeeds() {
  const feeds = await getMainCategoryFeeds()
  const favoriteState = await getFavoriteState(feeds.flatMap(({ listings }) => listings.map(({ id }) => id)))
  return feeds.map((feed) => <CategoryFeed key={feed.category.id} feed={feed} favoriteState={favoriteState} />)
}

function CategoryFeed({
  feed,
  favoriteState
}: {
  feed: Awaited<ReturnType<typeof getMainCategoryFeeds>>[number]
  favoriteState: Awaited<ReturnType<typeof getFavoriteState>>
}) {
  const { category, listings } = feed
  const headingId = `feed-${category.slug}`
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-xl font-semibold sm:text-2xl">
            Recently added in {category.name}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">The latest listings across {category.name.toLowerCase()} and its subcategories.</p>
        </div>
        <Button nativeButton={false} variant="ghost" render={<Link href={`/?category=${category.slug}#listings`} />}>
          View all <ArrowRight />
        </Button>
      </div>
      {listings.length ? (
        <ListingCarousel
          label={category.name}
          slides={listings.map((listing) => ({
            id: listing.id,
            content: (
              <ListingCard
                listing={listing}
                isFavorited={favoriteState.favoritedIds.has(listing.id)}
                isAuthenticated={favoriteState.isAuthenticated}
                showFavorite={favoriteState.canUseMarketplace}
                prefetch={false}
                imageSizes="(min-width: 1536px) 364px, (min-width: 1280px) 300px, (min-width: 1024px) 320px, (min-width: 768px) 235px, (min-width: 640px) 296px, calc((100vw - 32px) * 0.85)"
              />
            )
          }))}
        />
      ) : (
        <div className="bg-card text-muted-foreground mt-5 rounded-xl border border-dashed p-6 text-sm">No listings in this category yet.</div>
      )}
    </section>
  )
}
