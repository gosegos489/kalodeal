import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { HOMEPAGE_LISTINGS_LIMIT } from './constants'
import { listingCardSelect, toListingSummary } from './listing-summary'
import { getPublicListingIds, publicListingEligibilitySql } from './public-eligibility'

export async function getRecentListings() {
  const listings = await getCachedRecentListings()
  // Paid periods and grants can expire without a listing mutation.
  const visible = await getPublicListingIds(listings.map(({ id }) => id))
  return listings.filter(({ id }) => visible.has(id))
}

async function getCachedRecentListings() {
  'use cache'
  cacheLife('hours')
  cacheTag(cacheTags.listings)
  const ids = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT eligible_listing.id FROM listing eligible_listing
    WHERE eligible_listing.status = 'ACTIVE' AND ${publicListingEligibilitySql()}
    ORDER BY eligible_listing."createdAt" DESC, eligible_listing.id DESC
    LIMIT ${HOMEPAGE_LISTINGS_LIMIT}::integer
  `)
  const listings = await prisma.listing.findMany({
    where: { id: { in: ids.map(({ id }) => id) }, status: 'ACTIVE' },
    select: listingCardSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: HOMEPAGE_LISTINGS_LIMIT
  })
  return listings.map(toListingSummary)
}
