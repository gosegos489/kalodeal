import 'server-only'
import { getAccount } from '@/features/account/data'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { getAnalyticsDateRange, getAnalyticsPeriod } from './period'

export async function getAnalytics(periodParam: unknown, pageParam?: string | string[]) {
  // Re-authenticate and check server entitlements in the query entry point, independently of page/navigation props.
  const account = await getAccount()
  if (!account.limits.advancedStats) return { eligible: false as const }
  const userId = account.user.id
  const period = getAnalyticsPeriod(periodParam)
  const day = getAnalyticsDateRange(period)
  const where = { userId }
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ totalItems, pageParam })
  const [listings, statuses, favorites, phones, lifetimeViews, periodViews] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        phoneReveals: true,
        stats: { select: { views: true } },
        _count: { select: { favorites: true } }
      },
      orderBy: [{ sortDate: 'desc' }, { id: 'desc' }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.listing.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.favorite.count({ where: { listing: { userId } } }),
    prisma.listing.aggregate({ where, _sum: { phoneReveals: true } }),
    prisma.listingStats.aggregate({ where: { listing: { userId } }, _sum: { views: true } }),
    day ? prisma.listingDailyView.count({ where: { listing: { userId }, day } }) : Promise.resolve(null)
  ])
  const viewCounts =
    day && listings.length
      ? await prisma.listingDailyView.groupBy({
          by: ['listingId'],
          where: { listing: { userId }, listingId: { in: listings.map((listing) => listing.id) }, day },
          _count: { _all: true }
        })
      : []
  const viewsByListing = new Map(viewCounts.map((item) => [item.listingId, item._count._all]))
  const countsByStatus = new Map(statuses.map((item) => [item.status, item._count._all]))
  return {
    eligible: true as const,
    period,
    ...pagination,
    overview: {
      totalViews: lifetimeViews._sum.views ?? 0,
      periodViews,
      favorites,
      phoneReveals: phones._sum.phoneReveals ?? 0,
      active: countsByStatus.get('ACTIVE') ?? 0,
      pending: countsByStatus.get('PENDING') ?? 0,
      sold: countsByStatus.get('SOLD') ?? 0
    },
    listings: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      status: listing.status,
      phoneReveals: listing.phoneReveals,
      views: day ? (viewsByListing.get(listing.id) ?? 0) : (listing.stats?.views ?? 0),
      favorites: listing._count.favorites
    }))
  }
}
