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
      _count: {
        select: {
          listings: true
        }
      },

      children: {
        where: {
          isActive: true
        },

        orderBy: {
          sortOrder: 'asc'
        },

        include: {
          _count: {
            select: {
              listings: true
            }
          },

          children: {
            where: {
              isActive: true
            },

            orderBy: {
              sortOrder: 'asc'
            },

            include: {
              _count: {
                select: {
                  listings: true
                }
              }
            }
          }
        }
      }
    }
  })
}

type CategoryTreeItem = Awaited<ReturnType<typeof getCategoryTree>>[number]

function countListings(category: CategoryTreeItem) {
  return (
    category._count.listings +
    category.children.reduce(
      (childrenTotal, child) =>
        childrenTotal + child._count.listings + child.children.reduce((total, grandchild) => total + grandchild._count.listings, 0),
      0
    )
  )
}

export async function getCategorySummaries() {
  const categories = await getCategoryTree()

  return categories.map(toCategorySummary)
}

export type CategorySummary = Awaited<ReturnType<typeof getCategorySummaries>>[number]

function toCategorySummary(category: CategoryTreeItem) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.icon,
    description: category.description,
    listingCount: countListings(category),
    searchTerms: category.children.flatMap((child) => [child.name, ...child.children.map((grandchild) => grandchild.name)]),
    children: category.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      image: child.icon,
      description: child.description,
      listingCount: child._count.listings + child.children.reduce((total, grandchild) => total + grandchild._count.listings, 0),
      searchTerms: child.children.map((grandchild) => grandchild.name),
      children: child.children.map((grandchild) => ({
        id: grandchild.id,
        name: grandchild.name,
        slug: grandchild.slug,
        image: grandchild.icon,
        description: grandchild.description,
        listingCount: grandchild._count.listings,
        searchTerms: [],
        children: []
      }))
    }))
  }
}
