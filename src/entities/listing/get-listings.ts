import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { SEARCH_RESULTS_LIMIT } from './constants'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import { type ListingFilters, listingFiltersSchema } from './schema'

export async function getListings(filters: ListingFilters = {}) {
  'use cache'

  cacheTag(cacheTags.listings)
  cacheLife('hours')

  const result = listingFiltersSchema.safeParse(filters)
  if (!result.success) return []

  const listings = await prisma.listing.findMany({
    where: getListingWhere(result.data),
    select: listingSummarySelect,
    orderBy: [{ sortDate: 'desc' }, { id: 'desc' }],
    take: SEARCH_RESULTS_LIMIT
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
