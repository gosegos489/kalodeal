import { getLocale } from 'next-intl/server'
import 'server-only'
import { cache } from 'react'
import { listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { getPublicListingIds } from '@/entities/listing/public-eligibility'
import { requireMarketplaceUser } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'

export const getAccount = cache(async function getAccount() {
  const session = await requireMarketplaceUser(await getLocale())
  const userId = session.user.id

  const [access, listingSlotCount, featuredUsed] = await Promise.all([
    getUserAccess(prisma, userId),
    prisma.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } }),
    prisma.listing.count({ where: { userId, status: 'ACTIVE', featuredAt: { not: null } } })
  ])

  const { plan, subscription } = access

  return {
    user: session.user,
    plan,
    paidPlan: access.paidPlan,
    complimentaryGrant: access.manualGrant ? { endsAt: access.manualGrant.endsAt } : null,
    planBoostSource: access.planBoostSource,
    planBoostsRemaining: access.planBoostsRemaining,
    bonusBoostsRemaining: access.bonusBoostsRemaining,
    boostPeriodEndsAt: access.planBoostSource === 'paid' ? subscription?.currentPeriodEnd : access.manualPeriod?.endsAt,
    limits: PLAN_LIMITS[plan],
    listingSlotCount,
    featuredUsed,
    monthlyBoosts: access.monthlyBoosts,
    planBoostsUsed: access.planBoostsUsed,
    subscription: subscription
      ? {
          status: subscription.status,
          stripeStatus: subscription.stripeStatus,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          boostsUsed: subscription.boostsUsed,
          hasStripeSubscription: !!subscription.stripeCustomerId && !!subscription.stripeSubscriptionId
        }
      : null,
    boostsRemaining: access.boostsRemaining
  }
})

export async function getMyListings(pageParam?: string | string[]) {
  const session = await requireMarketplaceUser(await getLocale())
  const where = { userId: session.user.id }
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ pageParam, totalItems })

  const listings = await prisma.listing.findMany({
    where,
    select: {
      ...listingSummarySelect,
      status: true,
      boostedAt: true,
      featuredAt: true,
      updatedAt: true,
      moderationReason: true,
      moderationMessage: true
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: pagination.skip,
    take: pagination.take
  })

  const visible = await getPublicListingIds(listings.map(({ id }) => id))
  return {
    listings: listings.map((listing) => ({
      ...toListingSummary(listing),
      status: listing.status,
      boostedAt: listing.boostedAt,
      featured: !!listing.featuredAt,
      planLimited: listing.status === 'ACTIVE' && !visible.has(listing.id),
      updatedAt: listing.updatedAt.toISOString(),
      moderationReason: listing.moderationReason,
      moderationMessage: listing.moderationMessage
    })),
    ...pagination
  }
}
