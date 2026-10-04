import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { activePlanGrantWhere, availableBumpGrantWhere, getUserAccess } from '@/lib/user-access'

export class BumpError extends Error {}

// The action owns the transaction: every debit rolls back if listing promotion fails.
export async function bumpListingWithCredit(tx: Prisma.TransactionClient, userId: string, listingId: string) {
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
  if (!(await isActiveMarketplaceUser(tx, userId))) throw new BumpError('This account is unavailable.')
  const now = new Date()
  const listing = await tx.listing.findFirst({ where: { id: listingId, userId, status: 'ACTIVE' }, select: { categoryId: true } })
  if (!listing) throw new BumpError('Only your own active listings can be bumped.')
  const access = await getUserAccess(tx, userId, now)
  const expiringBonus = await tx.bumpGrant.findFirst({
    where: { ...availableBumpGrantWhere(userId, now), expiresAt: { gt: now } },
    select: { id: true },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
  })

  async function debitBonus(id: string) {
    const debited = await tx.bumpGrant.updateMany({
      where: { id, ...availableBumpGrantWhere(userId, now) },
      data: { remaining: { decrement: 1 } }
    })
    if (debited.count !== 1) throw new BumpError('This bonus bump is no longer available. Reload and try again.')
  }

  if (expiringBonus) {
    await debitBonus(expiringBonus.id)
  } else if (access.planBumpsRemaining > 0 && access.planBumpSource === 'paid' && access.subscription) {
    const subscription = access.subscription
    const debited = await tx.subscription.updateMany({
      where: {
        userId,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        bumpUsed: { lt: PLAN_LIMITS.PRO.monthlyBumps }
      },
      data: { bumpUsed: { increment: 1 } }
    })
    if (debited.count !== 1) throw new BumpError('You have used all bumps for this paid billing period.')
  } else if (access.planBumpsRemaining > 0 && access.manualGrant && access.manualPeriod) {
    // Lazy 30-day reset under the same lock; no cron and no Subscription writes.
    const debited = await tx.planGrant.updateMany({
      where: {
        id: access.manualGrant.id,
        ...activePlanGrantWhere(userId, now),
        bumpUsed: access.manualGrant.bumpUsed,
        bumpPeriodStart: access.manualGrant.bumpPeriodStart
      },
      data: { bumpPeriodStart: access.manualPeriod.startsAt, bumpUsed: access.manualPeriod.used + 1 }
    })
    if (debited.count !== 1) throw new BumpError('Your complimentary allowance has changed. Reload and try again.')
  } else {
    const bonus = await tx.bumpGrant.findFirst({
      where: { userId, remaining: { gt: 0 }, expiresAt: null },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    })
    if (!bonus) throw new BumpError('No plan or bonus bumps remaining.')
    await debitBonus(bonus.id)
  }

  // Preserve @updatedAt: promotion must not advance the content-edit version.
  const updated = await tx.$executeRaw`
    UPDATE listing SET "bumpedAt" = ${now}, "sortDate" = ${now}
    WHERE id = ${listingId} AND "userId" = ${userId} AND status = 'ACTIVE'
  `
  if (updated !== 1) throw new BumpError('This listing is no longer active.')
  return listing.categoryId
}
