import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { MAX_LISTING_PHOTOS } from '@/lib/plan-limits'
import type { ListingSummary } from './types'

export const listingSummarySelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  currency: true,
  pricePeriod: true,
  priceNegotiable: true,
  district: true,
  area: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: {
    select: { key: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 1
  }
} satisfies Prisma.ListingSelect

// Public cards need ordered photo URLs, while compact owner/staff rows only need the cover.
export const listingCardSelect = {
  ...listingSummarySelect,
  images: { ...listingSummarySelect.images, take: MAX_LISTING_PHOTOS }
} satisfies Prisma.ListingSelect

type ListingSummaryRow = Prisma.ListingGetPayload<{ select: typeof listingSummarySelect }>

export function toListingSummary({ images, price, ...listing }: ListingSummaryRow): ListingSummary {
  return {
    ...listing,
    price: price?.toNumber() ?? null,
    coverUrl: getListingImageUrl(images[0]?.key),
    imageUrls: images.flatMap(({ key }) => {
      const url = getListingImageUrl(key)
      return url ? [url] : []
    })
  }
}

export function getListingImageUrl(key: string | undefined) {
  const publicUrl = process.env.R2_PUBLIC_URL

  return key && publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}` : null
}
