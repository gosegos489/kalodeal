import { ArrowRight } from 'lucide-react'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { getMainCategoryFeeds } from '@/entities/listing/get-main-category-feeds'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { ListingCarousel } from '@/entities/listing/ui/listing-carousel'
import { getFavoriteState } from '@/features/favorites/data'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export async function HomeCategoryFeeds({ searchParams }: HomePageProps) {
  const { filters, invalidFilters } = await getBrowseContext(searchParams)
  // General category feeds must not look like matches for a location search.
  if (filters.district || invalidFilters) return null
  const feeds = await getMainCategoryFeeds()
  const favoriteState = await getFavoriteState(feeds.flatMap(({ listings }) => listings.map(({ id }) => id)))
  return feeds.map((feed) => <CategoryFeed key={feed.category.id} feed={feed} favoriteState={favoriteState} />)
}

async function CategoryFeed({
  feed,
  favoriteState
}: {
  feed: Awaited<ReturnType<typeof getMainCategoryFeeds>>[number]
  favoriteState: Awaited<ReturnType<typeof getFavoriteState>>
}) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Home' })
  const { category, listings } = feed
  const name = categoryName(category, messages.CategoryNames)
  const headingId = `feed-${category.slug}`
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-xl font-semibold sm:text-2xl">
            {t('recentCategory', { category: name })}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('categoryFeedIntro', { category: name })}</p>
        </div>
        <Button nativeButton={false} variant="ghost" render={<Link href={`/?category=${category.slug}#listings`} />}>
          {t('viewAll')} <ArrowRight />
        </Button>
      </div>
      {listings.length ? (
        <ListingCarousel
          label={name}
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
        <div className="bg-card text-muted-foreground mt-5 rounded-xl border border-dashed p-6 text-sm">{t('noCategoryListings')}</div>
      )}
    </section>
  )
}
