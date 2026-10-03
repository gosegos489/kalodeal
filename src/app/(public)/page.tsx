import { ArrowRight, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense, cache } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { getListings } from '@/entities/listing/get-listings'
import { getMainCategoryFeeds } from '@/entities/listing/get-main-category-feeds'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { ListingCarousel } from '@/entities/listing/ui/listing-carousel'
import { getFavoriteState } from '@/features/favorites/data'
import { ListingSearch } from '@/features/listing-search/ui/listing-search'
import { buildCollectionJsonLd, buildWebsiteJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { buildMetadata, getCategoryPath, seoConfig } from '@/lib/metadata'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'
import HeroSection from './_ui/HeroSection'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const getBrowseContext = cache(async (searchParams: Props['searchParams']) => {
  const raw = await searchParams
  const result = listingFiltersSchema.safeParse({ query: raw.q, category: raw.category })
  const filters = result.success ? result.data : {}
  const category = filters.category ? await getPublicCategory(filters.category) : null
  const isSearch = 'q' in raw || Object.keys(raw).some((key) => key !== 'category') || !result.success || ('category' in raw && !category)
  const title = filters.query ? `Search results for “${filters.query}”` : category ? `${category.category.name} listings` : 'Buy and Sell Locally'
  const description = filters.query
    ? 'Search local listings on Kalodeal. Explore available offers and contact sellers directly.'
    : category
      ? `Browse ${category.category.name} listings on Kalodeal. ${category.category.description || 'Explore local offers and contact sellers directly.'}`
      : seoConfig.description

  return { filters, category, isSearch, title, description, path: category ? getCategoryPath(category.category.slug) : '/' }
})

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { title, description, path, isSearch } = await getBrowseContext(searchParams)
  return buildMetadata({ title, description, path, ...(isSearch && { robots: { index: false, follow: true } }) })
}

async function BrowseIntro({ searchParams, children }: Props & { children: React.ReactNode }) {
  const { category, filters, title, description, path, isSearch } = await getBrowseContext(searchParams)
  const breadcrumbs = category ? getCategoryBreadcrumbs(category.category, category.ancestors) : []

  return (
    <>
      {!isSearch && <JsonLd data={buildWebsiteJsonLd()} />}
      {category && !isSearch && <JsonLd data={buildCollectionJsonLd({ title, description, path, breadcrumbs })} />}
      {category && (
        <BreadCrumbs items={breadcrumbs.map((item, index) => ({ ...item, ...(index === breadcrumbs.length - 1 && { href: undefined }) }))} />
      )}
      <HeroSection title={filters.query || category ? title : undefined} description={category || filters.query ? description : undefined}>
        {children}
      </HeroSection>
    </>
  )
}

async function HomeContent({ searchParams }: Props) {
  const feeds = await getMainCategoryFeeds()
  const categories = feeds.map(({ category }) => category)
  const searchCategories = categories.flatMap((category) => [
    { slug: category.slug, name: category.name },
    ...category.children.flatMap((child) => [
      { slug: child.slug, name: `${category.name} / ${child.name}` },
      ...child.children.map((grandchild) => ({ slug: grandchild.slug, name: `${category.name} / ${child.name} / ${grandchild.name}` }))
    ])
  ])

  return (
    <div className="flex min-w-0 flex-col gap-12 sm:gap-16">
      <Suspense fallback={<HeroLoading />}>
        <BrowseIntro searchParams={searchParams}>
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl sm:h-20" />}>
            <ListingSearch variant="hero" placeholder="What are you looking for?" categories={searchCategories} />
          </Suspense>
        </BrowseIntro>
      </Suspense>
      <section id="listings" aria-labelledby="listings-heading" className="scroll-mt-6">
        <Suspense fallback={<ListingsLoading />}>
          <ListingResults searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="categories-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="categories-heading" className="text-xl font-semibold sm:text-2xl">
              Explore categories
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">Find your next deal, one category at a time.</p>
          </div>
          <Button nativeButton={false} variant="ghost" render={<Link href="/categories" />}>
            All categories <ArrowRight />
          </Button>
        </div>
        {categories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.slice(0, 12).map((category) => (
              <div key={category.id} className="bg-card overflow-hidden rounded-xl border">
                <CategoryCard {...category} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">Categories are currently unavailable.</p>
        )}
      </section>
      <Suspense fallback={<ListingsLoading />}>
        <CategoryFeeds feeds={feeds} />
      </Suspense>
    </div>
  )
}

async function CategoryFeeds({ feeds }: { feeds: Awaited<ReturnType<typeof getMainCategoryFeeds>> }) {
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
                imageSizes="(max-width: 639px) calc((100vw - 32px) * 0.85), (max-width: 767px) calc((100vw - 48px) / 2), (max-width: 1279px) calc((100vw - 64px) / 3), calc((100vw - 80px) / 4)"
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

function HeroLoading() {
  return (
    <div role="status" aria-label="Loading search" className="max-w-5xl">
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="mt-3 h-6 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-48 w-full rounded-2xl sm:mt-8 sm:h-20" />
    </div>
  )
}

function CategoriesLoading() {
  return (
    <div role="status" aria-label="Loading search, listings and categories">
      <HeroLoading />
      <div className="mt-12 sm:mt-16">
        <ListingsLoading />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function ListingsLoading() {
  return (
    <div role="status" aria-label="Loading listings" className="flex flex-col gap-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

async function ListingResults({ searchParams }: Props) {
  const { filters, category } = await getBrowseContext(searchParams)
  const listings = await getListings(filters)
  const favoriteState = await getFavoriteState(listings.map(({ id }) => id))
  const filtered = Boolean(filters.query || filters.category)
  const title = filters.query
    ? `Results for “${filters.query}”`
    : filters.category
      ? `Listings in ${category?.category.name || filters.category.replaceAll('-', ' ')}`
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
              eager={index < 4}
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
            {filtered ? 'Try a different keyword or explore another category.' : 'Give something you no longer need a new home.'}
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

export default function Home({ searchParams }: Props) {
  return (
    <div className="container py-8 sm:py-10">
      <Suspense fallback={<CategoriesLoading />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
