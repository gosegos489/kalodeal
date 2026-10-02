import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { getListings } from '@/entities/listing/get-listings'
import { getMainCategoryFeeds } from '@/entities/listing/get-main-category-feeds'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { ListingCard } from '@/entities/listing/ui/listing-card'
import { ListingCarousel } from '@/entities/listing/ui/listing-carousel'
import { ListingSearch } from '@/features/listing-search/ui/listing-search'
import HeroSection from './_ui/HeroSection'

type Props = { searchParams: Promise<{ q?: string; category?: string }> }

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
      <HeroSection>
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl sm:h-20" />}>
          <ListingSearch variant="hero" placeholder="What are you looking for?" categories={searchCategories} />
        </Suspense>
      </HeroSection>
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
      {feeds.map((feed) => (
        <CategoryFeed key={feed.category.id} feed={feed} />
      ))}
    </div>
  )
}

function CategoryFeed({ feed }: { feed: Awaited<ReturnType<typeof getMainCategoryFeeds>>[number] }) {
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
        <ListingCarousel label={category.name} slides={listings.map((listing) => ({ id: listing.id, content: <ListingCard listing={listing} /> }))} />
      ) : (
        <div className="bg-card text-muted-foreground mt-5 rounded-xl border border-dashed p-6 text-sm">No listings in this category yet.</div>
      )}
    </section>
  )
}

function CategoriesLoading() {
  return (
    <div role="status" aria-label="Loading search, listings and categories">
      <HeroSection>
        <Skeleton className="h-48 w-full rounded-2xl sm:h-20" />
      </HeroSection>
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
  const { q, category } = await searchParams
  const result = listingFiltersSchema.safeParse({ query: q, category })
  const filters = result.success ? result.data : {}
  const listings = await getListings(filters)
  const filtered = Boolean(filters.query || filters.category)
  const title = filters.query
    ? `Results for “${filters.query}”`
    : filters.category
      ? `Listings in ${filters.category.replaceAll('-', ' ')}`
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
          <Button nativeButton={false} variant="outline" render={<Link href="/#listings" />}>
            Clear filters
          </Button>
        )}
      </div>
      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} eager={index < 4} />
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
            <Button nativeButton={false} variant="outline" render={<Link href="/#listings" />}>
              Browse all listings <ArrowRight />
            </Button>
          ) : (
            <Link href="/sell" className="text-primary text-sm font-medium underline underline-offset-4">
              Post a listing
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
