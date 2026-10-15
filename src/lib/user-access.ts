import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { PLAN_LIMITS, getComplimentaryBoostPeriod, getListingPlan, getPaidListingPlan } from './plan-limits'

type AccessDatabase = Pick<Prisma.TransactionClient, 'subscription' | 'planGrant' | 'boostGrant'>

export function activePlanGrantWhere(userId: string, now: Date): Prisma.PlanGrantWhereInput {
  return { userId, plan: 'PRO', startsAt: { lte: now }, endsAt: { gt: now }, revokedAt: null }
}

export function availableBoostGrantWhere(userId: string, now: Date): Prisma.BoostGrantWhereInput {
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
        stripeStatus: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        boostsUsed: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true
      }
    }),
    db.planGrant.findFirst({
      where: activePlanGrantWhere(userId, now),
      select: { id: true, plan: true, startsAt: true, endsAt: true, revokedAt: true, boostPeriodStart: true, boostsUsed: true },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }]
    }),
    db.boostGrant.aggregate({ where: availableBoostGrantWhere(userId, now), _sum: { remaining: true } })
  ])
  const paidPlan = getPaidListingPlan(subscription, now)
  const plan = getListingPlan(subscription, now, manualGrant)
  const manualPeriod = manualGrant ? getComplimentaryBoostPeriod(manualGrant, now) : null
  const planBoostSource = manualGrant && plan !== paidPlan ? 'complimentary' : paidPlan !== 'FREE' ? 'paid' : manualGrant ? 'complimentary' : null
  const planBoostsUsed = planBoostSource === 'paid' ? (subscription?.boostsUsed ?? 0) : (manualPeriod?.used ?? 0)
  const planBoostsRemaining = Math.max(0, PLAN_LIMITS[planBoostSource === 'paid' ? paidPlan : plan].monthlyBoosts - planBoostsUsed)
  const bonusBoostsRemaining = bonus._sum.remaining ?? 0
  return {
    plan,
    paidPlan,
    subscription,
    manualGrant,
    manualPeriod,
    planBoostSource,
    planBoostsUsed,
    monthlyBoosts: PLAN_LIMITS[planBoostSource === 'paid' ? paidPlan : plan].monthlyBoosts,
    planBoostsRemaining,
    bonusBoostsRemaining,
    boostsRemaining: planBoostsRemaining + bonusBoostsRemaining
  }
}
