import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

export const LISTING_SITEMAP_SIZE = 10000

export async function getListingSitemapIds() {
  'use cache'
  cacheTag(cacheTags.listings)
  cacheLife('hours')

  const count = await prisma.listing.count({ where: { status: 'ACTIVE' } })
  return Array.from({ length: Math.ceil(count / LISTING_SITEMAP_SIZE) }, (_, id) => ({ id }))
}

export async function getListingSitemapPage(page: number) {
  'use cache'
  cacheTag(cacheTags.listings)
  cacheLife('hours')

  if (!Number.isSafeInteger(page) || page < 0 || !Number.isSafeInteger(page * LISTING_SITEMAP_SIZE)) return []

  return prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, updatedAt: true },
    orderBy: { id: 'asc' },
    skip: page * LISTING_SITEMAP_SIZE,
    take: LISTING_SITEMAP_SIZE
  })
}
