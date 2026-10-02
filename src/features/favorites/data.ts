import 'server-only'
import { listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { getSession, requireUser } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'

export async function getFavoriteState(listingIds: string[]) {
  const session = await getSession()
  const favorites =
    session && listingIds.length
      ? await prisma.favorite.findMany({
          where: { userId: session.user.id, listingId: { in: [...new Set(listingIds)] } },
          select: { listingId: true }
        })
      : []

  return { isAuthenticated: !!session, favoritedIds: new Set(favorites.map(({ listingId }) => listingId)) }
}

export async function getMyFavorites(pageParam?: string | string[]) {
  const session = await requireUser()
  const where = { userId: session.user.id, listing: { status: 'ACTIVE' as const } }

  // Count, page clamping and rows share a snapshot, including during concurrent removals.
  return prisma.$transaction(
    async (tx) => {
      const totalItems = await tx.favorite.count({ where })
      const pagination = getPagination({ pageParam, totalItems })
      const favorites = await tx.favorite.findMany({
        where,
        select: { listing: { select: listingSummarySelect } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      })

      return { listings: favorites.map(({ listing }) => toListingSummary(listing)), ...pagination }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}
