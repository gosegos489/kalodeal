import 'server-only'
import { cache } from 'react'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { formatLocation } from '@/entities/location/catalog'
import { getCategoryPath, seoConfig } from '@/lib/metadata'

export type HomePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const getBrowseContext = cache(async (searchParams: HomePageProps['searchParams']) => {
  const raw = await searchParams
  const optionalValue = (value: string | string[] | undefined) => (typeof value === 'string' && !value.trim() ? undefined : value)
  const result = listingFiltersSchema.safeParse({
    query: optionalValue(raw.q),
    category: optionalValue(raw.category),
    district: optionalValue(raw.district),
    area: optionalValue(raw.area)
  })
  const filters = result.success ? result.data : {}
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
    category,
    isSearch,
    invalidFilters: !result.success,
    location,
    title,
    description,
    path: category ? getCategoryPath(category.category.slug) : '/'
  }
})
