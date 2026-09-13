import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

export const listingFiltersSchema = z
  .object({
    query: z.string().trim().max(100).optional(),
    category: z.string().trim().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()
  })
  .strict()

type ListingFilters = z.input<typeof listingFiltersSchema>

export async function getListings(filters: ListingFilters = {}) {
  'use cache'

  cacheTag(cacheTags.listings)
  cacheLife('hours')

  const result = listingFiltersSchema.safeParse(filters)

  if (!result.success) {
    return []
  }

  const { query, category } = result.data
  const search = query?.trim()
  const categorySlug = category?.trim()

  const listings = await prisma.listing.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(categorySlug
        ? {
            category: {
              OR: [
                { slug: categorySlug },
                { parent: { is: { slug: categorySlug } } },
                { parent: { is: { parent: { is: { slug: categorySlug } } } } }
              ]
            }
          }
        : {})
    },
    include: {
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  return listings.map((listing) => ({
    ...listing,
    price: listing.price?.toNumber() ?? null
  }))
}

export type ListingSummary = Awaited<ReturnType<typeof getListings>>[number]
