import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { getPublicCategory } from '@/entities/category/get-category-tree'
import type { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { HOMEPAGE_LISTINGS_LIMIT, SEARCH_RESULTS_LIMIT } from './constants'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import { type ListingFilters, listingFiltersSchema } from './schema'

export async function getListings(filters: ListingFilters = {}) {
  const result = listingFiltersSchema.safeParse(filters)
  if (!result.success) return []

  const { query, category } = result.data
  // Only known public categories can create shared cache entries. Keep other
  // filters request-time without changing the existing category visibility policy.
  if (query || (category && !(await getPublicCategory(category)))) return readListings({ query, category }, SEARCH_RESULTS_LIMIT)

  return getBrowseListings(category)
}

async function getBrowseListings(category: string | undefined) {
  'use cache'

  cacheTag(cacheTags.listings)
  cacheLife('hours')

  return readListings({ category }, category ? SEARCH_RESULTS_LIMIT : HOMEPAGE_LISTINGS_LIMIT)
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

function getListingWhere({ query, category }: ListingFilters): Prisma.ListingWhereInput {
  return {
    status: 'ACTIVE',
    ...(query && {
      OR: [{ title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }]
    }),
    ...(category && {
      category: {
        OR: [{ slug: category }, { parent: { is: { slug: category } } }, { parent: { is: { parent: { is: { slug: category } } } } }]
      }
    })
  }
}
