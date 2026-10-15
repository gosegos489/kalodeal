import 'server-only'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { getModerationQuery } from '../shared/search'
import { categoryIdSchema } from './schema'
import { requireCategoryIconManager } from './server'

export type CategoryIconSearchParams = { q?: string | string[]; page?: string | string[] }

export async function getCategoryIconQueue(params: CategoryIconSearchParams) {
  await requireCategoryIconManager()
  const query = getModerationQuery(params.q)
  const contains = { contains: query, mode: 'insensitive' } as const
  const where = query ? { OR: [{ name: contains }, { slug: contains }, { id: contains }, { parent: { is: { name: contains } } }] } : {}
  return prisma.$transaction(
    async (tx) => {
      const totalItems = await tx.category.count({ where })
      const pagination = getPagination({ pageParam: params.page, totalItems, pageSize: 20 })
      const categories = await tx.category.findMany({
        where,
        select: { id: true, name: true, slug: true, icon: true, isActive: true, parent: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        skip: pagination.skip,
        take: pagination.take
      })
      return { categories, query, ...pagination }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}

export async function getCategoryIconEditor(id: unknown) {
  await requireCategoryIconManager()
  const parsed = categoryIdSchema.safeParse(id)
  if (!parsed.success) return null
  return prisma.category.findUnique({
    where: { id: parsed.data },
    select: { id: true, name: true, slug: true, icon: true, isActive: true, updatedAt: true, parent: { select: { id: true, name: true } } }
  })
}
