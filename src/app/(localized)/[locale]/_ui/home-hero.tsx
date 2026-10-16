import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import type { HomepageCategory } from '@/entities/category/get-homepage-categories'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import { ListingSearch } from '@/features/listing-search/ui/listing-search'
import { ListingSearchSkeleton } from '@/features/listing-search/ui/listing-search-skeleton'
import { categoryName } from '@/i18n/category-name'
import { ClientMessages } from '@/i18n/client-messages'
import { buildCollectionJsonLd, buildWebsiteJsonLd, getCategoryBreadcrumbs } from '@/lib/json-ld'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'
import { type HomePageProps, getBrowseContext } from '../_lib/browse-context'

export async function HomeHero({ searchParams, categories }: HomePageProps & { categories: HomepageCategory[] }) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Home' })
  const { category, location, title, description, path, isSearch } = await getBrowseContext(searchParams)
  const breadcrumbs = category ? getCategoryBreadcrumbs(category.category, category.ancestors, locale, messages.CategoryNames) : []
  const searchCategories = categories.map((category) => ({ slug: category.slug, name: categoryName(category, messages.CategoryNames) }))
  // Nested categories remain available through /categories. Keep an incoming
  // nested selection visible without shipping the entire tree to the client.
  if (category && !searchCategories.some(({ slug }) => slug === category.category.slug)) {
    searchCategories.push({
      slug: category.category.slug,
      name: [...category.ancestors, category.category].map((item) => categoryName(item, messages.CategoryNames)).join(' / ')
    })
  }

  return (
    <div className="min-w-0 space-y-4">
      {!isSearch && <JsonLd data={buildWebsiteJsonLd(locale, description)} />}
      {category && !isSearch && <JsonLd data={buildCollectionJsonLd({ title, description, path, breadcrumbs, locale })} />}
      {category && (
        <BreadCrumbs items={breadcrumbs.map((item, index) => ({ ...item, ...(index === breadcrumbs.length - 1 && { href: undefined }) }))} />
      )}
      <section id="search-filters" aria-labelledby="hero-heading" className="bg-card min-w-0 scroll-mt-6 rounded-2xl border p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          {category && <CategoryIcon value={category.category.image} size={28} />}
          <div className="min-w-0">
            <h1 id="hero-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t('searchListings')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {category
                ? t('categorySearchIntro', {
                    category: categoryName(category.category, messages.CategoryNames),
                    location: location ? `, ${location}` : ''
                  })
                : t('searchIntro')}
            </p>
          </div>
        </div>
        <Suspense fallback={<ListingSearchSkeleton />}>
          <ClientMessages
            locale={locale}
            messages={{
              Search: {
                search: messages.Search.search,
                searching: messages.Search.searching,
                searchListings: messages.Search.searchListings,
                searchingListings: messages.Search.searchingListings,
                clearSearch: messages.Search.clearSearch,
                allCategories: messages.Search.allCategories,
                listingCategory: messages.Search.listingCategory,
                invalidLocation: messages.Search.invalidLocation,
                updateError: messages.Search.updateError,
                retry: messages.Search.retry,
                fields: { category: messages.Search.fields.category, district: messages.Search.fields.district, area: messages.Search.fields.area }
              },
              Locations: messages.Locations
            }}
          >
            <ListingSearch variant="hero" placeholder={t('placeholder')} categories={searchCategories} />
          </ClientMessages>
        </Suspense>
      </section>
    </div>
  )
}
