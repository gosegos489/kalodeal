import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

const categoryIdSchema = z.string().cuid()

export async function getCategoryListings(categoryId: unknown) {
  'use cache'

  const result = categoryIdSchema.safeParse(categoryId)

  if (!result.success) {
    return []
  }

  const validCategoryId = result.data

  cacheTag(cacheTags.categoryListings(validCategoryId))
  cacheLife('hours')

  const posts = await prisma.listing.findMany({
    where: {
      categoryId: validCategoryId,
      status: 'ACTIVE'
    },
    orderBy: {
      sortDate: 'desc'
    },
    take: 10
  })

  return posts.map((post) => ({
    ...post,
    price: post.price?.toNumber() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  }))
}

export type CategoryListing = Awaited<ReturnType<typeof getCategoryListings>>[number]
