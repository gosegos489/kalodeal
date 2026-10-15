import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { HOMEPAGE_LISTINGS_LIMIT, SEARCH_RESULTS_LIMIT } from './constants'
import { mergeFeaturedListings } from './featured-ranking'
import { getFeaturedListings } from './get-featured-listings'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import { getListingWhere } from './listing-where'
import { getPublicListingIds } from './public-eligibility'
import { type ListingFilters, listingFiltersSchema } from './schema'

export async function getListings(filters: ListingFilters = {}) {
  const result = listingFiltersSchema.safeParse(filters)
  if (!result.success) return []

  const { query, category, district, area } = result.data
  // Only known public categories can create shared cache entries. Keep other
  // filters request-time without changing the existing category visibility policy.
  const take = query || category || district ? SEARCH_RESULTS_LIMIT : HOMEPAGE_LISTINGS_LIMIT
  const [organic, featured] = await Promise.all([
    query || (category && !(await getPublicCategory(category)))
      ? readListings({ query, category, district, area }, take)
      : getBrowseListings(category, district, area),
    getFeaturedListings(getListingWhere({ query, category, district, area }), take)
  ])
  const visible = await getPublicListingIds([...organic, ...featured].map(({ id }) => id))
  return mergeFeaturedListings(
    organic.filter(({ id }) => visible.has(id)),
    featured.filter(({ id }) => visible.has(id)),
    take
  )
}

async function getBrowseListings(category: string | undefined, district: string | undefined, area: string | undefined) {
  'use cache'

  cacheTag(cacheTags.listings)
  cacheLife('hours')

  return readListings({ category, district, area }, category || district ? SEARCH_RESULTS_LIMIT : HOMEPAGE_LISTINGS_LIMIT)
}

async function readListings(filters: ListingFilters, take: number) {
  const listings = await prisma.listing.findMany({
    where: getListingWhere(filters),
    select: listingSummarySelect,
    orderBy: [{ sortDate: 'desc' }, { id: 'desc' }],
    take
  })

  return listings.map(toListingSummary)
}
