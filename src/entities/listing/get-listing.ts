import 'server-only'
import { cache } from 'react'
import { getPublicSeller } from '@/entities/user/get-public-seller'
import { listingAttributeSelect, serializeListingAttributes } from '@/features/listing-attributes/persistence'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession } from '@/lib/auth-utils'
import { MAX_LISTING_PHOTOS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getListingImageUrl, listingSummarySelect, toListingSummary } from './listing-summary'
import { getPublicListingIds } from './public-eligibility'
import { listingIdSchema } from './schema'
import type { ListingDetails } from './types'

// React cache only deduplicates within a request; personalized data never enters a shared cache.
const getListingRow = cache(async (id: string, userId: string | null) => {
  return prisma.listing.findUnique({
    where: { id },
    select: {
      ...listingSummarySelect,
      ...listingAttributeSelect,
      status: true,
      userId: true,
      phone: true,
      facebookUrl: true,
      messengerUrl: true,
      _count: { select: { favorites: true } },
      favorites: { where: { userId: userId ?? '' }, select: { id: true }, take: 1 },
      category: { select: { name: true, slug: true } },
      images: {
        select: { id: true, key: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: MAX_LISTING_PHOTOS
      }
    }
  })
})

export async function getListing(id: unknown): Promise<ListingDetails | null> {
  const result = listingIdSchema.safeParse(id)
  if (!result.success) return null

  const session = await getSession(true)
  const listing = await getListingRow(result.data, session?.user.id ?? null)
  if (!listing) return null

  const { userId, phone, facebookUrl, messengerUrl, status, favorites, _count, propertyDetails, vehicleDetails, ...summary } = listing
  const isOwner = session?.user.id === userId
  const publiclyVisible = status === 'ACTIVE' && (await getPublicListingIds([listing.id])).has(listing.id)
  if (!publiclyVisible && !isOwner) return null
  const seller = await getPublicSeller(userId)
  if (!seller) return null

  return {
    ...toListingSummary(summary),
    ...serializeListingAttributes({ ...listing, propertyDetails, vehicleDetails }),
    category: listing.category,
    status,
    publiclyVisible,
    facebookUrl,
    messengerUrl,
    maskedPhone: phone ? `${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '').slice(0, 3)} ••••••` : null,
    seller: {
      id: seller.id,
      name: seller.listingName,
      image: seller.listingImage,
      createdAt: seller.createdAt,
      activeAds: seller.activeAds
    },
    isOwner,
    isAuthenticated: !!session,
    canUseMarketplace: canUseMarketplace(session?.user.role),
    isFavorited: !!session && favorites.length > 0,
    favoritesCount: _count.favorites,
    images: listing.images.flatMap((image) => {
      const url = getListingImageUrl(image.key)
      return url ? [{ id: image.id, url }] : []
    })
  }
}
