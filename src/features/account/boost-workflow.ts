import 'server-only'
import { getPublicListingIds } from '@/entities/listing/public-eligibility'
import type { Prisma } from '@/generated/prisma/client'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { activePlanGrantWhere, availableBoostGrantWhere, getUserAccess } from '@/lib/user-access'

export class BoostError extends Error {}

// The action owns the transaction: every debit rolls back if listing promotion fails.
export async function boostListingWithCredit(tx: Prisma.TransactionClient, userId: string, listingId: string) {
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
  if (!(await isActiveMarketplaceUser(tx, userId))) throw new BoostError('This account is unavailable.')
  const now = new Date()
  const listing = await tx.listing.findFirst({ where: { id: listingId, userId, status: 'ACTIVE' }, select: { categoryId: true } })
  if (!listing) throw new BoostError('Only your own active listings can be boosted.')
  if (!(await getPublicListingIds([listingId], tx)).has(listingId)) throw new BoostError('This listing exceeds your current plan allowance.')
  const access = await getUserAccess(tx, userId, now)
  const expiringBonus = await tx.boostGrant.findFirst({
    where: { ...availableBoostGrantWhere(userId, now), expiresAt: { gt: now } },
    select: { id: true },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
  })

  async function debitBonus(id: string) {
    const debited = await tx.boostGrant.updateMany({
      where: { id, ...availableBoostGrantWhere(userId, now) },
      data: { remaining: { decrement: 1 } }
    })
    if (debited.count !== 1) throw new BoostError('This bonus boost is no longer available. Reload and try again.')
  }

  if (expiringBonus) {
    await debitBonus(expiringBonus.id)
  } else if (access.planBoostsRemaining > 0 && access.planBoostSource === 'paid' && access.subscription) {
    const subscription = access.subscription
    const debited = await tx.subscription.updateMany({
      where: {
        userId,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        boostsUsed: { lt: access.monthlyBoosts }
      },
      data: { boostsUsed: { increment: 1 } }
    })
    if (debited.count !== 1) throw new BoostError('You have used all boosts for this paid billing period.')
  } else if (access.planBoostsRemaining > 0 && access.manualGrant && access.manualPeriod) {
    // Lazy 30-day reset under the same lock; no cron and no Subscription writes.
    const debited = await tx.planGrant.updateMany({
      where: {
        id: access.manualGrant.id,
        ...activePlanGrantWhere(userId, now),
        boostsUsed: access.manualGrant.boostsUsed,
        boostPeriodStart: access.manualGrant.boostPeriodStart
      },
      data: { boostPeriodStart: access.manualPeriod.startsAt, boostsUsed: access.manualPeriod.used + 1 }
    })
    if (debited.count !== 1) throw new BoostError('Your complimentary allowance has changed. Reload and try again.')
  } else {
    const bonus = await tx.boostGrant.findFirst({
      where: { userId, remaining: { gt: 0 }, expiresAt: null },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    })
    if (!bonus) throw new BoostError('No plan or bonus boosts remaining.')
    await debitBonus(bonus.id)
  }

  // Preserve @updatedAt: promotion must not advance the content-edit version.
  const updated = await tx.$executeRaw`
    UPDATE listing SET "bumpedAt" = ${now}, "sortDate" = ${now}
    WHERE id = ${listingId} AND "userId" = ${userId} AND status = 'ACTIVE'
  `
  if (updated !== 1) throw new BoostError('This listing is no longer active.')
  return listing.categoryId
}
