import 'server-only'
import type { CategorySummary } from '@/entities/category/get-category-tree'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { CATEGORY_FEED_LIMIT } from './constants'

type CategoryFeedListingId = { rootId: string; listingId: string }

export async function getCategoryFeedListingIds(categories: CategorySummary[]) {
  if (!categories.length) return []

  const groups = categories.map((category) => {
    const ids = getCategoryIds(category)
    return Prisma.sql`(${category.id}::text, ARRAY[${Prisma.join(ids)}]::text[])`
  })

  // Prisma cannot apply a single take across a root and its descendants for every root.
  // LATERAL limits each feed in the database; only IDs are read here, in one query.
  return prisma.$queryRaw<CategoryFeedListingId[]>(Prisma.sql`
    WITH category_groups("rootId", "categoryIds") AS (VALUES ${Prisma.join(groups)})
    SELECT category_groups."rootId", recent.id AS "listingId"
    FROM category_groups
    CROSS JOIN LATERAL (
      SELECT id, "createdAt"
      FROM listing
      WHERE "categoryId" = ANY(category_groups."categoryIds") AND status = 'ACTIVE'
      ORDER BY "createdAt" DESC, id DESC
      LIMIT ${CATEGORY_FEED_LIMIT}
    ) recent
    ORDER BY category_groups."rootId", recent."createdAt" DESC, recent.id DESC
  `)
}

function getCategoryIds(category: CategorySummary): string[] {
  return [category.id, ...category.children.flatMap(getCategoryIds)]
}
