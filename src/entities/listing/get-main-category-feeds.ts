import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { getCategorySummaries } from '@/entities/category/get-category-tree'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { CATEGORY_FEED_LIMIT } from './constants'
import { mergeFeaturedListings } from './featured-ranking'
import { getCategoryFeedListingIds } from './get-category-feed-listing-ids'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import { getPublicListingIds } from './public-eligibility'
import type { ListingSummary } from './types'

export async function getMainCategoryFeeds() {
  const cached = await getOrganicMainCategoryFeeds()
  const [categories, visible] = await Promise.all([
    getCategorySummaries(),
    getPublicListingIds(cached.flatMap(({ listings }) => listings.map(({ id }) => id)))
  ])
  const organic = cached.map((feed) => ({
    category: categories.find(({ id }) => id === feed.category.id) ?? feed.category,
    listings: feed.listings.filter(({ id }) => visible.has(id))
  }))
  const feedIds = await getCategoryFeedListingIds(
    organic.map(({ category }) => category),
    true
  )
  if (!feedIds.length) return organic
  const now = new Date()
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: feedIds.map(({ listingId }) => listingId) },
      status: 'ACTIVE',
      featuredAt: { not: null },
      user: {
        subscription: {
          is: { plan: 'BUSINESS', status: { in: ['ACTIVE', 'CANCELED'] }, currentPeriodStart: { lte: now }, currentPeriodEnd: { gt: now } }
        }
      }
    },
    select: { ...listingSummarySelect, userId: true }
  })
  const featuredVisible = await getPublicListingIds(listings.map(({ id }) => id))
  const byId = new Map(
    listings.filter(({ id }) => featuredVisible.has(id)).map(({ userId, ...listing }) => [listing.id, { userId, summary: toListingSummary(listing) }])
  )
  return organic.map(({ category, listings: normal }) => {
    const byOwner = new Map<string, number>()
    const featured = feedIds
      .filter(({ rootId }) => rootId === category.id)
      .flatMap(({ listingId }) => {
        const listing = byId.get(listingId)
        if (!listing || (byOwner.get(listing.userId) ?? 0) >= 2) return []
        byOwner.set(listing.userId, (byOwner.get(listing.userId) ?? 0) + 1)
        return [listing.summary]
      })
    return { category, listings: mergeFeaturedListings(normal, featured, CATEGORY_FEED_LIMIT) }
  })
}

async function getOrganicMainCategoryFeeds() {
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
