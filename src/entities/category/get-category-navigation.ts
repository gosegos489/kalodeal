import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'
import { buildCategoryNavigationTree } from './navigation-tree'

// Navigation does not need the listing counts or full records in getCategoryTree.
export async function getCategoryNavigation() {
  'use cache'
  cacheLife('days')
  cacheTag(cacheTags.categories)

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, icon: true, parentId: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  })
  return buildCategoryNavigationTree(categories)
}
