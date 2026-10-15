import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { canRetainListingAttributes } from './category-change'
import { getCategoryAttributeProfile } from './rules'

// Use inside the existing mutation transaction after authorization. Do not trust
// a client-supplied slug/profile and do not cache this write-time category read.
export async function getListingAttributeCategory(tx: Pick<Prisma.TransactionClient, 'category'>, categoryId: string) {
  const category = await tx.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true, slug: true } })
  return category ? { ...category, profile: getCategoryAttributeProfile(category.slug) } : null
}

// Read only; the caller keeps its ownership/RBAC, locks and conditional version
// write. No details are discarded by the existing category-only editor.
export async function canChangeListingAttributeCategory(
  tx: Pick<Prisma.TransactionClient, 'listing'>,
  listingId: string,
  categorySlug: string,
  price: string | null
) {
  const listing = await tx.listing.findUnique({
    where: { id: listingId },
    select: {
      priceNegotiable: true,
      pricePeriod: true,
      propertyDetails: { omit: { listingId: true } },
      vehicleDetails: { omit: { listingId: true } }
    }
  })
  if (!listing) return false
  return canRetainListingAttributes(categorySlug, price, {
    ...listing,
    propertyDetails: listing.propertyDetails && {
      ...listing.propertyDetails,
      plotArea: listing.propertyDetails.plotArea?.toNumber() ?? null,
      propertyArea: listing.propertyDetails.propertyArea?.toNumber() ?? null
    }
  })
}
