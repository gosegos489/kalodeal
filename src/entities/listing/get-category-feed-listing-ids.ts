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

  return prisma.$queryRaw<CategoryFeedListingId[]>(Prisma.sql`
    WITH category_groups("rootId", "categoryIds") AS (VALUES ${Prisma.join(groups)})
    SELECT category_groups."rootId", recent.id AS "listingId"
    FROM category_groups
    CROSS JOIN LATERAL (
      SELECT id, "sortDate"
      FROM listing
      WHERE "categoryId" = ANY(category_groups."categoryIds") AND status = 'ACTIVE'
      ORDER BY "sortDate" DESC, id DESC
      LIMIT ${CATEGORY_FEED_LIMIT}
    ) recent
    ORDER BY category_groups."rootId", recent."sortDate" DESC, recent.id DESC
  `)
}

function getCategoryIds(category: CategorySummary): string[] {
  return [category.id, ...category.children.flatMap(getCategoryIds)]
}
