import 'server-only'
import { getCategoryTaxonomy } from '@/entities/category/get-category-taxonomy'
import { buildListingAttributeQuery } from '@/features/listing-attributes/filters'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { Prisma } from '@/generated/prisma/client'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { HOMEPAGE_LISTINGS_LIMIT, SEARCH_RESULTS_LIMIT } from './constants'
import { getFeaturedListings } from './get-featured-listings'
import { listingCardSelect, toListingSummary } from './listing-summary'
import { publicListingEligibilitySql } from './public-eligibility'
import { type ListingFilters, listingFiltersSchema } from './schema'
import { listingSearchPageSql, listingSearchWhereSql } from './search-where-sql'
import type { ListingSummary } from './types'

export async function getListings(filters: ListingFilters = {}) {
  return (
    await getListingSearchResults(
      filters,
      {},
      undefined,
      filters.query || filters.category || filters.district ? SEARCH_RESULTS_LIMIT : HOMEPAGE_LISTINGS_LIMIT
    )
  ).listings
}

// Arbitrary searches are request-time. Homepage feeds/recent listings and the
// category catalogue retain their tagged caches. Time-based entitlements and
// bans must participate in both count and pagination at the current request.
export async function getListingSearchResults(
  base: ListingFilters,
  attributes: unknown = {},
  pageParam?: string | string[],
  pageSize = SEARCH_RESULTS_LIMIT
) {
  pageSize = Math.max(1, Math.min(SEARCH_RESULTS_LIMIT, Math.floor(pageSize) || SEARCH_RESULTS_LIMIT))
  const parsed = listingFiltersSchema.safeParse(base)
  if (!parsed.success) return { listings: [] as ListingSummary[], pagination: getPagination({ totalItems: 0, pageSize }) }
  const taxonomy = await getCategoryTaxonomy()
  const category = taxonomy.find((category) => category.slug === parsed.data.category)
  const profile = getCategoryAttributeProfile(category?.slug ?? '')
  const now = new Date()
  const { where, orderBy } = buildListingAttributeQuery(parsed.data, profile, attributes, now)
  const predicate = Prisma.sql`${listingSearchWhereSql(where)} AND ${publicListingEligibilitySql(now)}`
  return prisma.$transaction(
    async (tx) => {
      const [counts] = await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM listing eligible_listing WHERE ${predicate}
    `)
      const pagination = getPagination({ pageParam, totalItems: counts.count, pageSize })
      if (!pagination.totalItems) return { listings: [] as ListingSummary[], pagination }
      const featured = await getFeaturedListings(where, SEARCH_RESULTS_LIMIT, tx, now)
      const featuredIds = featured.map(({ id }) => id)
      // Rank before slicing, so Featured placements never repeat on page 2.
      // Organic sortDate preserves Boost, and price order uses it to break ties.
      const rows = await tx.$queryRaw<{ id: string }[]>(listingSearchPageSql(predicate, orderBy, featuredIds, pagination))
      const listings = await tx.listing.findMany({
        where: { AND: [where, { id: { in: rows.map(({ id }) => id) } }] },
        select: listingCardSelect,
        take: pagination.take
      })
      const byId = new Map(listings.map((row) => [row.id, toListingSummary(row)]))
      return {
        listings: rows.flatMap(({ id }) => {
          const row = byId.get(id)
          return row ? [row] : []
        }),
        pagination
      }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}
