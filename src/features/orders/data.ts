import { redirect } from 'next/navigation'
import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'

export async function getMySubscriptionPayments(pageParam?: string | string[]) {
  const session = await getMutationSession()
  if (!session) redirect('/login')
  const where = { userId: session.user.id, status: 'PAID' as const, amount: { gt: 0 } }

  return prisma.$transaction(
    async (tx) => {
      const totalItems = await tx.subscriptionPayment.count({ where })
      const pagination = getPagination({ pageParam, totalItems })
      const payments = await tx.subscriptionPayment.findMany({
        where,
        select: { id: true, description: true, amount: true, currency: true, status: true, paidAt: true },
        orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
        skip: pagination.skip,
        take: pagination.take
      })
      return { payments, ...pagination }
    },
    { isolationLevel: 'RepeatableRead' }
  )
}
