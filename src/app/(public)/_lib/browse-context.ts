import 'server-only'
import { cache } from 'react'
import { getCategoryTaxonomy } from '@/entities/category/get-category-taxonomy'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { formatLocation } from '@/entities/location/catalog'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { parseListingSearch } from '@/features/listing-search/model/search-params'
import { getCategoryPath, seoConfig } from '@/lib/metadata'

export type HomePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const getBrowseContext = cache(async (searchParams: HomePageProps['searchParams']) => {
  const raw = await searchParams
  const taxonomy = await getCategoryTaxonomy()
  const selected = taxonomy.find((category) => category.slug === raw.category)
  const profile = getCategoryAttributeProfile(selected?.slug ?? '')
  const result = parseListingSearch(raw, profile)
  const filters = result.success ? result.base : {}
  const category = filters.category ? await getPublicCategory(filters.category) : null
  const isSearch = 'q' in raw || Object.keys(raw).some((key) => key !== 'category') || !result.success || ('category' in raw && !category)
  const location = formatLocation({ district: filters.district ?? null, area: filters.area ?? null })
  const title = filters.query
    ? `Search results for “${filters.query}”`
    : category
      ? `${category.category.name} listings${location ? ` in ${location}` : ''}`
      : location
        ? `Listings in ${location}`
        : 'Buy and Sell Locally'
  const description = filters.query
    ? 'Search local listings on Kalodeal. Explore available offers and contact sellers directly.'
    : category
      ? `Browse ${category.category.name} listings on Kalodeal. ${category.category.description || 'Explore local offers and contact sellers directly.'}`
      : location
        ? `Browse local listings in ${location} on Kalodeal. Explore available offers and contact sellers directly.`
        : seoConfig.description

  return {
    filters,
    attributes: result.success ? result.attributes : undefined,
    pageParam: raw.page,
    filterError: result.success ? null : result.message,
    category,
    isSearch,
    invalidFilters: !result.success,
    location,
    title,
    description,
    path: category ? getCategoryPath(category.category.slug) : '/'
  }
})
