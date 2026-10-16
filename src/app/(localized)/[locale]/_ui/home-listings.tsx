import { Search } from 'lucide-react'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { getPublicCategories } from '@/entities/category/get-category-tree'
import { getListingSearchResults } from '@/entities/listing/get-listings'
import { getRecentListings } from '@/entities/listing/get-recent-listings'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { getFavoriteState } from '@/features/favorites/data'
import { ListingFilters } from '@/features/listing-search/ui/listing-filters'
import { categoryName } from '@/i18n/category-name'
import { ClientMessages } from '@/i18n/client-messages'
import { Link } from '@/i18n/navigation'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export async function HomeListings({ searchParams }: HomePageProps) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Home' })
  const { filters, attributes, pageParam, location, invalidFilters, isSearch } = await getBrowseContext(searchParams)
  const filtered = Boolean(isSearch || filters.category || invalidFilters)
  const result = !invalidFilters && filtered ? await getListingSearchResults(filters, attributes, pageParam) : null
  const listings = invalidFilters ? [] : result ? result.listings : await getRecentListings()
  const categories = (await getPublicCategories()).map(({ category, ancestors }) => ({
    slug: category.slug,
    name: [...ancestors, category].map((item) => categoryName(item, messages.CategoryNames)).join(' / ')
  }))
  const favoriteState = await getFavoriteState(listings.map(({ id }) => id))

  return (
    <ClientMessages
      locale={locale}
      messages={{ Search: messages.Search, Attributes: { values: messages.Attributes.values }, Locations: messages.Locations }}
    >
      <ListingFilters categories={categories}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="listings-heading" className="text-xl font-semibold sm:text-2xl">
              {filtered ? t('searchResults') : t('recentlyAdded')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm" role="status">
              {filtered ? t('resultCount', { count: result?.pagination.totalItems ?? 0, shown: listings.length }) : t('recentIntro')}
            </p>
            {location && (filters.query || filters.category) && <p className="text-muted-foreground mt-1 text-sm">{location}</p>}
            {(attributes?.sort === 'PRICE_LOW' || attributes?.sort === 'PRICE_HIGH') && (
              <p className="text-muted-foreground mt-1 text-xs">{t('featuredPriceNote')}</p>
            )}
          </div>
        </div>
        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {listings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                eager={index === 0}
                prefetch={false}
                imageSizes="(min-width: 1536px) calc((100vw - 380px) / 4), (min-width: 1280px) calc((100vw - 360px) / 3), (min-width: 1024px) calc((100vw - 340px) / 2), (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)"
                isFavorited={favoriteState.favoritedIds.has(listing.id)}
                isAuthenticated={favoriteState.isAuthenticated}
                showFavorite={favoriteState.canUseMarketplace}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
            <Search aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold">{filtered ? t('noResults') : t('firstListing')}</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              {invalidFilters ? t('invalidFilters') : filtered ? t('trySearch') : t('firstIntro')}
            </p>
            {filtered ? (
              <a href="#search-filters" className="text-primary text-sm font-medium underline underline-offset-4">
                {t('adjustFilters')}
              </a>
            ) : favoriteState.canUseMarketplace ? (
              <Link href="/sell" className="text-primary text-sm font-medium underline underline-offset-4">
                {t('postListing')}
              </Link>
            ) : (
              <Link href="/moderator" className="text-primary text-sm underline">
                Open moderator panel
              </Link>
            )}
          </div>
        )}
        {result && (
          <div className="mt-6">
            <NuqsPagination
              labels={{
                previous: messages.Search.previous,
                next: messages.Search.next,
                loading: messages.Search.loadingResults,
                pageOf: messages.Search.pageOf,
                goToPage: messages.Search.goToPage,
                error: messages.Search.pageError,
                retry: messages.Search.retry
              }}
              totalPages={result.pagination.totalPages}
              ariaLabel={t('pagination')}
            />
          </div>
        )}
      </ListingFilters>
    </ClientMessages>
  )
}
