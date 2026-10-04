import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { PLAN_LIMITS, getComplimentaryBumpPeriod, getListingPlan, getPaidListingPlan } from './plan-limits'

type AccessDatabase = Pick<Prisma.TransactionClient, 'subscription' | 'planGrant' | 'bumpGrant'>

export function activePlanGrantWhere(userId: string, now: Date): Prisma.PlanGrantWhereInput {
  return { userId, plan: 'PRO', startsAt: { lte: now }, endsAt: { gt: now }, revokedAt: null }
}

export function availableBumpGrantWhere(userId: string, now: Date): Prisma.BumpGrantWhereInput {
  return { userId, remaining: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
}

// Request-time reads only. Call with the transaction client under the owner lock for writes.
export async function getUserAccess(db: AccessDatabase, userId: string, now = new Date()) {
  const [subscription, manualGrant, bonus] = await Promise.all([
    db.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        bumpUsed: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true
      }
    }),
    db.planGrant.findFirst({
      where: activePlanGrantWhere(userId, now),
      select: { id: true, plan: true, startsAt: true, endsAt: true, revokedAt: true, bumpPeriodStart: true, bumpUsed: true },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }]
    }),
    db.bumpGrant.aggregate({ where: availableBumpGrantWhere(userId, now), _sum: { remaining: true } })
  ])
  const paidPlan = getPaidListingPlan(subscription, now)
  const plan = getListingPlan(subscription, now, manualGrant)
  const manualPeriod = manualGrant ? getComplimentaryBumpPeriod(manualGrant, now) : null
  const planBumpSource = paidPlan === 'PRO' ? 'paid' : manualGrant ? 'complimentary' : null
  const planBumpsUsed = planBumpSource === 'paid' ? (subscription?.bumpUsed ?? 0) : (manualPeriod?.used ?? 0)
  const planBumpsRemaining = Math.max(0, PLAN_LIMITS[plan].monthlyBumps - planBumpsUsed)
  const bonusBumpsRemaining = bonus._sum.remaining ?? 0
  return {
    plan,
    paidPlan,
    subscription,
    manualGrant,
    manualPeriod,
    planBumpSource,
    planBumpsRemaining,
    bonusBumpsRemaining,
    bumpsRemaining: planBumpsRemaining + bonusBumpsRemaining
  }
}
