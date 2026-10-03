import 'server-only'
import { getListingImageUrl, listingSummarySelect } from '@/entities/listing/listing-summary'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession, requireMarketplaceUser } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import type { FavoriteListing } from './types'

export async function getFavoriteState(listingIds: string[]) {
  const session = await getSession(true)
  const favorites =
    session && canUseMarketplace(session.user.role) && listingIds.length
      ? await prisma.favorite.findMany({
          where: { userId: session.user.id, listingId: { in: [...new Set(listingIds)] } },
          select: { listingId: true }
        })
      : []

  return {
    isAuthenticated: !!session,
    canUseMarketplace: canUseMarketplace(session?.user.role),
    favoritedIds: new Set(favorites.map(({ listingId }) => listingId))
  }
}

export async function getMyFavorites(pageParam?: string | string[]) {
  const session = await requireMarketplaceUser()
  const where = { userId: session.user.id }

  // Count, page clamping and rows share a snapshot, including during concurrent removals.
  return prisma.$transaction(
    async (tx) => {
      const totalItems = await tx.favorite.count({ where })
      const pagination = getPagination({ pageParam, totalItems })
      const favorites = await tx.favorite.findMany({
        where,
        // Show the current related listing, including unavailable statuses, without contacts or private owner data.
        select: { listing: { select: { ...listingSummarySelect, description: false, createdAt: false, status: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      })

      const listings: FavoriteListing[] = favorites.map(({ listing: { images, price, ...listing } }) => ({
        ...listing,
        price: price?.toNumber() ?? null,
        coverUrl: getListingImageUrl(images[0]?.key)
      }))

      return { listings, ...pagination }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}
