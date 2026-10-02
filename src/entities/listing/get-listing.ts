import 'server-only'
import { cache } from 'react'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { getSession } from '@/lib/auth-utils'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getListingImageUrl, listingSummarySelect, toListingSummary } from './listing-summary'
import { listingIdSchema } from './schema'
import type { ListingDetails } from './types'

// React cache only deduplicates within a request; personalized data never enters a shared cache.
const getListingRow = cache(async (id: string, userId: string | null) => {
  return prisma.listing.findUnique({
    where: { id },
    select: {
      ...listingSummarySelect,
      status: true,
      userId: true,
      phone: true,
      _count: { select: { favorites: true } },
      favorites: { where: { userId: userId ?? '' }, select: { id: true }, take: 1 },
      user: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      images: {
        select: { id: true, key: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: PLAN_LIMITS.PRO.imagesPerListing
      }
    }
  })
})

export async function getListing(id: unknown): Promise<ListingDetails | null> {
  const result = listingIdSchema.safeParse(id)
  if (!result.success) return null

  const session = await getSession()
  const listing = await getListingRow(result.data, session?.user.id ?? null)
  if (!listing) return null

  const { userId, user, phone, status, favorites, _count, ...summary } = listing
  const isOwner = session?.user.id === userId
  if (status !== 'ACTIVE' && !isOwner) return null

  return {
    ...toListingSummary(summary),
    category: listing.category,
    status,
    maskedPhone: phone ? `${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '').slice(0, 3)} ••••••` : null,
    seller: {
      name: getSellerName(user.name),
      image: getApprovedAvatarUrl(userId, user.image)
    },
    isOwner,
    isAuthenticated: !!session,
    isFavorited: !!session && favorites.length > 0,
    favoritesCount: _count.favorites,
    images: listing.images.flatMap((image) => {
      const url = getListingImageUrl(image.key)
      return url ? [{ id: image.id, url }] : []
    })
  }
}
