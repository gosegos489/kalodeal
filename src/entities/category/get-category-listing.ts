import { cacheLife, cacheTag } from 'next/cache'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

export async function getCategoryListings(categoryId: string) {
  'use cache'

  cacheTag(cacheTags.categoryListings(categoryId))
  cacheLife('hours')

  const posts = await prisma.listing.findMany({
    where: {
      categoryId
    },
    orderBy: {
      createdAt: 'desc'
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
