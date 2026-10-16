import 'server-only'
import { getCategoryTaxonomy } from '@/entities/category/get-category-taxonomy'
import { listingCardSelect, toListingSummary } from '@/entities/listing/listing-summary'
import { publicListingEligibilitySql } from '@/entities/listing/public-eligibility'
import { Prisma } from '@/generated/prisma/client'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { getSellerCategoryCounts, sellerIdSchema } from './get-public-seller'
import { getSellerCategoryFilters, getSellerCategoryIds } from './seller-categories'

export async function getSellerListings(userId: string, filters: { category?: string | string[]; page?: string | string[] }) {
  sellerIdSchema.parse(userId)
  const categories = await getCategoryTaxonomy()
  const category = typeof filters.category === 'string' ? filters.category.slice(0, 150) : ''
  const ids = category ? getSellerCategoryIds(categories, category) : null
  // Counts and paginated results see one DB snapshot. Eligibility is applied
  // before pagination, never by filtering a page after it has been fetched.
  return prisma.$transaction(
    async (tx) => {
      const now = new Date()
      const counts = await getSellerCategoryCounts(userId, tx, now)
      const total = counts.reduce((sum, row) => sum + row.count, 0)
      const count = ids ? counts.filter((row) => ids.includes(row.categoryId)).reduce((sum, row) => sum + row.count, 0) : total
      const pagination = getPagination({ pageParam: filters.page, totalItems: count, pageSize: 12 })
      const selected = ids
        ? ids.length
          ? Prisma.sql`AND eligible_listing."categoryId" IN (${Prisma.join(ids)})`
          : Prisma.sql`AND FALSE`
        : Prisma.empty
      const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT eligible_listing.id FROM listing eligible_listing
      WHERE eligible_listing."userId" = ${userId} AND eligible_listing.status = 'ACTIVE'
        ${selected} AND ${publicListingEligibilitySql(now)}
      ORDER BY eligible_listing."sortDate" DESC, eligible_listing.id DESC
      LIMIT ${pagination.take}::integer OFFSET ${pagination.skip}::integer
    `)
      const listings = rows.length
        ? await tx.listing.findMany({
            where: { id: { in: rows.map((row) => row.id) }, userId, status: 'ACTIVE' },
            select: listingCardSelect,
            orderBy: [{ sortDate: 'desc' }, { id: 'desc' }],
            take: pagination.take
          })
        : []
      return { listings: listings.map(toListingSummary), pagination, total, category, categories: getSellerCategoryFilters(categories, counts) }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}
