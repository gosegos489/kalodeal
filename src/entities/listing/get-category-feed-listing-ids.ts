import 'server-only'
import type { CategorySummary } from '@/entities/category/get-category-tree'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { CATEGORY_FEED_LIMIT } from './constants'

type CategoryFeedListingId = { rootId: string; listingId: string }

export async function getCategoryFeedListingIds(categories: CategorySummary[], featured = false) {
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
      SELECT listing.id, listing."sortDate", listing."featuredAt"
      FROM listing
      WHERE "categoryId" = ANY(category_groups."categoryIds") AND listing.status = 'ACTIVE'
      ${
        featured
          ? Prisma.sql`AND "featuredAt" IS NOT NULL AND EXISTS (
        SELECT 1 FROM subscription s WHERE s."userId" = listing."userId" AND s.plan = 'BUSINESS'
          AND s.status IN ('ACTIVE', 'CANCELED') AND s."currentPeriodStart" <= (statement_timestamp() AT TIME ZONE 'UTC') AND s."currentPeriodEnd" > (statement_timestamp() AT TIME ZONE 'UTC')
      )`
          : Prisma.empty
      }
      ORDER BY ${featured ? Prisma.sql`"featuredAt" ASC, listing.id ASC` : Prisma.sql`"sortDate" DESC, listing.id DESC`}
      LIMIT ${featured ? 50 : CATEGORY_FEED_LIMIT}
    ) recent
    ORDER BY category_groups."rootId", ${featured ? Prisma.sql`recent."featuredAt" ASC, recent.id ASC` : Prisma.sql`recent."sortDate" DESC, recent.id DESC`}
  `)
}

function getCategoryIds(category: CategorySummary): string[] {
  return [category.id, ...category.children.flatMap(getCategoryIds)]
}
