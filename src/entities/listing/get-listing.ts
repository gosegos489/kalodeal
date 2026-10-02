import 'server-only'
import { cache } from 'react'
import { getSession } from '@/lib/auth-utils'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getListingImageUrl, listingSummarySelect, toListingSummary } from './listing-summary'
import { listingIdSchema } from './schema'
import type { ListingDetails } from './types'

const getListingRow = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    select: {
      ...listingSummarySelect,
      status: true,
      userId: true,
      phone: true,
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

  const listing = await getListingRow(result.data)
  if (!listing) return null

  const { userId, user, phone, status, ...summary } = listing
  const session = await getSession()
  const isOwner = session?.user.id === userId
  if (status !== 'ACTIVE' && !isOwner) return null

  return {
    ...toListingSummary(summary),
    category: listing.category,
    status,
    maskedPhone: phone ? `${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '').slice(0, 3)} ••••••` : null,
    seller: {
      name: user.name.includes('@') ? 'Seller' : user.name,
      image: getPublicSellerImageUrl(user.image)
    },
    isOwner,
    isAuthenticated: !!session,
    images: listing.images.flatMap((image) => {
      const url = getListingImageUrl(image.key)
      return url ? [{ id: image.id, url }] : []
    })
  }
}

function getPublicSellerImageUrl(image: string | null) {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!image || !publicUrl) return null

  try {
    const url = new URL(image)
    const storageUrl = new URL(publicUrl)
    return url.protocol === 'https:' && url.origin === storageUrl.origin && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
