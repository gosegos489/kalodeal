import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

// Seller listings follow the existing listing visibility policy, including
// previously assigned inactive categories. Navigation activity rules stay separate.
export async function getCategoryTaxonomy() {
  'use cache'
  cacheLife('days')
  cacheTag(cacheTags.categories)
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  })
}
