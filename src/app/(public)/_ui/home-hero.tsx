import { type ReactNode, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CategorySummary } from '@/entities/category/get-category-tree'
import { ListingSearch } from '@/features/listing-search/ui/listing-search'
import { buildCollectionJsonLd, buildWebsiteJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export function HomeHero({ searchParams, categories }: HomePageProps & { categories: CategorySummary[] }) {
  const searchCategories = categories.flatMap((category) => [
    { slug: category.slug, name: category.name },
    ...category.children.flatMap((child) => [
      { slug: child.slug, name: `${category.name} / ${child.name}` },
      ...child.children.map((grandchild) => ({ slug: grandchild.slug, name: `${category.name} / ${child.name} / ${grandchild.name}` }))
    ])
  ])

  return (
    <BrowseIntro searchParams={searchParams}>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl sm:h-20" />}>
        <ListingSearch variant="hero" placeholder="What are you looking for?" categories={searchCategories} />
      </Suspense>
    </BrowseIntro>
  )
}

async function BrowseIntro({ searchParams, children }: HomePageProps & { children: React.ReactNode }) {
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

function HeroSection({ children, title, description }: { children: ReactNode; title?: ReactNode; description?: string }) {
  return (
    <section aria-labelledby="hero-heading" className="max-w-5xl">
      <h1 id="hero-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title || (
          <>
            Find your next <span className="text-primary">local deal.</span>
          </>
        )}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
        {description || 'Discover everyday essentials, great finds and services from your local community.'}
      </p>
      <div className="mt-6 sm:mt-8">{children}</div>
    </section>
  )
}
