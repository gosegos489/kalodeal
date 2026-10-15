import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

// The homepage needs root cards, not the complete navigation tree or listing counts.
export async function getHomepageCategories() {
  'use cache'
  cacheLife('days')
  cacheTag(cacheTags.categories)
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    select: { id: true, name: true, slug: true, icon: true, description: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  })
}

export type HomepageCategory = Awaited<ReturnType<typeof getHomepageCategories>>[number]
