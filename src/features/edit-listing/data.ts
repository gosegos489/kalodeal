import 'server-only'
import { getListingImageUrl } from '@/entities/listing/listing-summary'
import { listingIdSchema } from '@/entities/listing/schema'
import { requireMarketplaceUser } from '@/lib/auth-utils'
import { PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import type { EditableListing } from './types'

export async function getEditableListing(id: unknown): Promise<(EditableListing & { categoryName: string }) | null> {
  const session = await requireMarketplaceUser()
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return null

  // Filter by ownership before selecting any private listing details.
  const [listing, subscription] = await Promise.all([
    prisma.listing.findFirst({
      where: { id: parsed.data, userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        categoryId: true,
        category: { select: { name: true } },
        phone: true,
        youtube: true,
        facebookUrl: true,
        messengerUrl: true,
        status: true,
        updatedAt: true,
        images: {
          select: { id: true, key: true, sortOrder: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          take: PLAN_LIMITS.PRO.imagesPerListing
        }
      }
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true }
    })
  ])
  if (!listing) return null

  return {
    id: listing.id,
    updatedAt: listing.updatedAt.toISOString(),
    status: listing.status,
    plan: getListingPlan(subscription),
    categoryName: listing.category.name,
    values: {
      title: listing.title,
      description: listing.description,
      price: listing.price?.toString() ?? '',
      currency: listing.currency,
      categoryId: listing.categoryId,
      phone: listing.phone,
      youtube: listing.youtube ?? '',
      facebookUrl: listing.facebookUrl ?? '',
      messengerUrl: listing.messengerUrl ?? ''
    },
    images: listing.images.map(({ id, key, sortOrder }) => ({ id, url: getListingImageUrl(key), sortOrder }))
  }
}
