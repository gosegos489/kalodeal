import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { getCategorySummaries } from '@/entities/category/get-category-tree'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { getCategoryFeedListingIds } from './get-category-feed-listing-ids'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import type { ListingSummary } from './types'

export async function getMainCategoryFeeds() {
  'use cache'

  cacheLife('hours')
  cacheTag(cacheTags.listings, cacheTags.categories)

  const categories = await getCategorySummaries()
  const feedIds = await getCategoryFeedListingIds(categories)
  const listings = feedIds.length
    ? await prisma.listing.findMany({
        where: { id: { in: feedIds.map(({ listingId }) => listingId) }, status: 'ACTIVE' },
        select: listingSummarySelect
      })
    : []
  const listingsById = new Map(listings.map((listing) => [listing.id, toListingSummary(listing)]))
  const listingsByCategory = new Map<string, ListingSummary[]>()

  for (const { rootId, listingId } of feedIds) {
    const listing = listingsById.get(listingId)
    if (!listing) continue

    const feed = listingsByCategory.get(rootId) ?? []
    feed.push(listing)
    listingsByCategory.set(rootId, feed)
  }

  return categories.map((category) => ({ category, listings: listingsByCategory.get(category.id) ?? [] }))
}
