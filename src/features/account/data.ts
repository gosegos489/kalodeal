import 'server-only'
import { listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { requireMarketplaceUser } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'

export async function getAccount() {
  const session = await requireMarketplaceUser()
  const userId = session.user.id

  const [access, listingSlotCount] = await Promise.all([
    getUserAccess(prisma, userId),
    prisma.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } })
  ])

  const { plan, subscription } = access

  return {
    user: session.user,
    plan,
    paidPlan: access.paidPlan,
    complimentaryGrant: access.manualGrant ? { endsAt: access.manualGrant.endsAt } : null,
    planBumpSource: access.planBumpSource,
    planBumpsRemaining: access.planBumpsRemaining,
    bonusBumpsRemaining: access.bonusBumpsRemaining,
    bumpPeriodEndsAt: access.planBumpSource === 'paid' ? subscription?.currentPeriodEnd : access.manualPeriod?.endsAt,
    limits: PLAN_LIMITS[plan],
    listingSlotCount,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          bumpUsed: subscription.bumpUsed,
          hasStripeSubscription: !!subscription.stripeCustomerId && !!subscription.stripeSubscriptionId
        }
      : null,
    bumpsRemaining: access.bumpsRemaining
  }
}

export async function getMyListings(pageParam?: string | string[]) {
  const session = await requireMarketplaceUser()
  const where = { userId: session.user.id }
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ pageParam, totalItems })

  const listings = await prisma.listing.findMany({
    where,
    select: { ...listingSummarySelect, status: true, bumpedAt: true, updatedAt: true, moderationReason: true, moderationMessage: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: pagination.skip,
    take: pagination.take
  })

  return {
    listings: listings.map((listing) => ({
      ...toListingSummary(listing),
      status: listing.status,
      bumpedAt: listing.bumpedAt,
      updatedAt: listing.updatedAt.toISOString(),
      moderationReason: listing.moderationReason,
      moderationMessage: listing.moderationMessage
    })),
    ...pagination
  }
}
