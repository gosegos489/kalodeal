import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'
import { publicListingEligibilitySql } from '@/entities/listing/public-eligibility'
import { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/lib/cache-tags'
import prisma from '@/lib/prisma'

export async function getCategoryTree() {
  const [categories, counts] = await Promise.all([
    getCachedCategoryTree(),
    prisma.$queryRaw<{ categoryId: string; count: number }[]>(Prisma.sql`
      SELECT eligible_listing."categoryId", COUNT(*)::int AS count FROM listing eligible_listing
      WHERE eligible_listing.status = 'ACTIVE' AND ${publicListingEligibilitySql()}
      GROUP BY eligible_listing."categoryId"
    `)
  ])
  const byCategory = new Map(counts.map(({ categoryId, count }) => [categoryId, count]))
  return categories.map((category) => ({
    ...category,
    _count: { listings: byCategory.get(category.id) ?? 0 },
    children: category.children.map((child) => ({
      ...child,
      _count: { listings: byCategory.get(child.id) ?? 0 },
      children: child.children.map((grandchild) => ({ ...grandchild, _count: { listings: byCategory.get(grandchild.id) ?? 0 } }))
    }))
  }))
}

async function getCachedCategoryTree() {
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
