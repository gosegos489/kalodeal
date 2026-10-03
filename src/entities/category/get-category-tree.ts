import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'
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
          listings: { where: { status: 'ACTIVE' } }
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
              listings: { where: { status: 'ACTIVE' } }
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
                  listings: { where: { status: 'ACTIVE' } }
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

export const getCategorySummaries = cache(async () => {
  const categories = await getCategoryTree()

  return categories.map(toCategorySummary)
})

export type CategorySummary = Awaited<ReturnType<typeof getCategorySummaries>>[number]

export type PublicCategory = { category: CategorySummary; ancestors: CategorySummary[] }

export const getPublicCategories = cache(async (): Promise<PublicCategory[]> => {
  const categories = await getCategorySummaries()
  return categories.flatMap((category) => [
    { category, ancestors: [] },
    ...category.children.flatMap((child) => [
      { category: child, ancestors: [category] },
      ...child.children.map((grandchild) => ({ category: grandchild, ancestors: [category, child] }))
    ])
  ])
})

export async function getPublicCategory(slug: string) {
  return (await getPublicCategories()).find(({ category }) => category.slug === slug) ?? null
}

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
