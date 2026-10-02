import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import type { ListingSummary } from './types'

export const listingSummarySelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  createdAt: true,
  category: { select: { name: true } },
  images: {
    select: { key: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 1
  }
} satisfies Prisma.ListingSelect

type ListingSummaryRow = Prisma.ListingGetPayload<{ select: typeof listingSummarySelect }>

export function toListingSummary({ images, price, ...listing }: ListingSummaryRow): ListingSummary {
  return {
    ...listing,
    price: price?.toNumber() ?? null,
    coverUrl: getListingImageUrl(images[0]?.key)
  }
}

export function getListingImageUrl(key: string | undefined) {
  const publicUrl = process.env.R2_PUBLIC_URL

  return key && publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}` : null
}
