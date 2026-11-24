import { getLocale } from 'next-intl/server'
import 'server-only'
import { getListingImageUrl } from '@/entities/listing/listing-summary'
import { listingIdSchema } from '@/entities/listing/schema'
import { listingAttributeSelect, serializeListingAttributes } from '@/features/listing-attributes/persistence'
import { requireMarketplaceUser } from '@/lib/auth-utils'
import { MAX_LISTING_PHOTOS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'
import type { EditableListing } from './types'

export async function getEditableListing(id: unknown): Promise<(EditableListing & { categoryName: string; categorySlug: string }) | null> {
  const session = await requireMarketplaceUser(await getLocale())
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return null

  // Filter by ownership before selecting any private listing details.
  const [listing, access] = await Promise.all([
    prisma.listing.findFirst({
      where: { id: parsed.data, userId: session.user.id },
      select: {
        ...listingAttributeSelect,
        id: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        categoryId: true,
        district: true,
        area: true,
        category: { select: { name: true, slug: true } },
        phone: true,
        youtube: true,
        facebookUrl: true,
        messengerUrl: true,
        status: true,
        moderationReason: true,
        moderationMessage: true,
        updatedAt: true,
        images: {
          select: { id: true, key: true, sortOrder: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          take: MAX_LISTING_PHOTOS
        }
      }
    }),
    getUserAccess(prisma, session.user.id)
  ])
  if (!listing) return null

  return {
    id: listing.id,
    updatedAt: listing.updatedAt.toISOString(),
    status: listing.status,
    moderationReason: listing.moderationReason,
    moderationMessage: listing.moderationMessage,
    plan: access.plan,
    categoryName: listing.category.name,
    categorySlug: listing.category.slug,
    values: {
      ...serializeListingAttributes({
        priceNegotiable: listing.priceNegotiable,
        pricePeriod: listing.pricePeriod,
        propertyDetails: listing.propertyDetails,
        vehicleDetails: listing.vehicleDetails
      }),
      title: listing.title,
      description: listing.description,
      price: listing.price?.toString() ?? '',
      currency: listing.currency,
      categoryId: listing.categoryId,
      district: listing.district ?? '',
      area: listing.area ?? '',
      phone: listing.phone,
      youtube: listing.youtube ?? '',
      facebookUrl: listing.facebookUrl ?? '',
      messengerUrl: listing.messengerUrl ?? ''
    },
    images: listing.images.map(({ id, key, sortOrder }) => ({ id, url: getListingImageUrl(key), sortOrder }))
  }
}
