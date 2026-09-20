import 'server-only'
import { requireUser } from '@/lib/auth-utils'
import { getListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'

export async function getAccount() {
  const session = await requireUser()
  const userId = session.user.id

  const [subscription, activeCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: 'ACTIVE' } })
  ])

  const plan = getListingPlan(subscription)

  return {
    user: session.user,
    plan,
    limits: PLAN_LIMITS[plan],
    activeCount
  }
}
