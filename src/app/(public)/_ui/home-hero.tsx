import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { HomepageCategory } from '@/entities/category/get-homepage-categories'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import { ListingSearch } from '@/features/listing-search/ui/listing-search'
import { buildCollectionJsonLd, buildWebsiteJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export async function HomeHero({ searchParams, categories }: HomePageProps & { categories: HomepageCategory[] }) {
  const { category, location, title, description, path, isSearch } = await getBrowseContext(searchParams)
  const breadcrumbs = category ? getCategoryBreadcrumbs(category.category, category.ancestors) : []
  const searchCategories = categories.map(({ slug, name }) => ({ slug, name }))
  // Nested categories remain available through /categories. Keep an incoming
  // nested selection visible without shipping the entire tree to the client.
  if (category && !searchCategories.some(({ slug }) => slug === category.category.slug)) {
    searchCategories.push({ slug: category.category.slug, name: [...category.ancestors, category.category].map(({ name }) => name).join(' / ') })
  }

  return (
    <div className="min-w-0 space-y-4">
      {!isSearch && <JsonLd data={buildWebsiteJsonLd()} />}
      {category && !isSearch && <JsonLd data={buildCollectionJsonLd({ title, description, path, breadcrumbs })} />}
      {category && <BreadCrumbs items={breadcrumbs.map((item, index) => ({ ...item, ...(index === breadcrumbs.length - 1 && { href: undefined }) }))} />}
      <section id="search-filters" aria-labelledby="hero-heading" className="bg-card min-w-0 scroll-mt-6 rounded-2xl border p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          {category && <CategoryIcon value={category.category.image} size={28} />}
          <div className="min-w-0">
            <h1 id="hero-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Search Listings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {category ? `Find your next deal in ${category.category.name}${location ? `, ${location}` : ''}.` : 'Find local goods, services and everyday essentials.'}
            </p>
          </div>
        </div>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl sm:h-40" />}>
          <ListingSearch variant="hero" placeholder="What are you looking for?" categories={searchCategories} />
        </Suspense>
      </section>
    </div>
  )
}
