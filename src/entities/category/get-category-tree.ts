import { cacheLife, cacheTag } from 'next/cache'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

export async function getCategoryTree() {
  'use cache'

  cacheTag(cacheTags.categories)
  cacheLife('days')

  return prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true
    },

    orderBy: {
      sortOrder: 'asc'
    },

    include: {
      children: {
        where: {
          isActive: true
        },

        orderBy: {
          sortOrder: 'asc'
        },

        include: {
          children: {
            where: {
              isActive: true
            },

            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      }
    }
  })
}
