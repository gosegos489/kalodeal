import 'server-only'
import { getListingImageUrl, listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { listingIdSchema } from '@/entities/listing/schema'
import { getSellerName } from '@/entities/user/public-profile'
import { getSettingsPageActor } from '@/features/account/settings/server'
import type { Prisma } from '@/generated/prisma/client'
import { getPagination } from '@/lib/pagination'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { type ModerationSearchParams, listingModerationWhere } from '../shared/search'

export const moderationListingSelect = {
  ...listingSummarySelect,
  category: { select: { id: true, name: true } },
  status: true,
  moderationReason: true,
  moderationMessage: true,
  user: { select: { name: true, email: true } }
} satisfies Prisma.ListingSelect

export function toModerationListing({ user, ...listing }: Prisma.ListingGetPayload<{ select: typeof moderationListingSelect }>) {
  return {
    ...toListingSummary(listing),
    category: listing.category,
    status: listing.status,
    moderationReason: listing.moderationReason,
    moderationMessage: listing.moderationMessage,
    seller: { name: getSellerName(user.name), email: user.email }
  }
}

export async function getListingModerationQueue(params: ModerationSearchParams = {}) {
  await getSettingsPageActor(true)
  const where = listingModerationWhere(params)
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ pageParam: params.page, totalItems })
  const listings = await prisma.listing.findMany({
    where,
    select: moderationListingSelect,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    skip: pagination.skip,
    take: pagination.take
  })

  return { listings: listings.map(toModerationListing), ...pagination }
}

export async function getModerationListing(id: unknown) {
  await getSettingsPageActor(true)
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return null

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data },
    select: {
      ...moderationListingSelect,
      updatedAt: true,
      phone: true,
      youtube: true,
      facebookUrl: true,
      messengerUrl: true,
      images: {
        select: { id: true, key: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: PLAN_LIMITS.PRO.imagesPerListing
      }
    }
  })
  if (!listing) return null

  return {
    ...toModerationListing(listing),
    updatedAt: listing.updatedAt.toISOString(),
    phone: listing.phone,
    youtube: listing.youtube,
    facebookUrl: listing.facebookUrl,
    messengerUrl: listing.messengerUrl,
    images: listing.images.flatMap(({ id: imageId, key }) => {
      const url = getListingImageUrl(key)
      return url ? [{ id: imageId, url }] : []
    })
  }
}
