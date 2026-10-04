import 'server-only'
import { cache } from 'react'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { getCategoryPath, seoConfig } from '@/lib/metadata'

export type HomePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const getBrowseContext = cache(async (searchParams: HomePageProps['searchParams']) => {
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
