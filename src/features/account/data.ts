import 'server-only'
import { listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { requireUser } from '@/lib/auth-utils'
import { getPagination } from '@/lib/pagination'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS, getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'

export async function getAccount() {
  const session = await requireUser()
  const userId = session.user.id

  const [subscription, listingSlotCount] = await Promise.all([
    prisma.subscription.findUnique({
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
    prisma.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } })
  ])

  const plan = getListingPlan(subscription)

  return {
    user: session.user,
    plan,
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
    bumpsRemaining: Math.max(0, PLAN_LIMITS[plan].monthlyBumps - (subscription?.bumpUsed ?? 0))
  }
}

export async function getMyListings(pageParam?: string | string[]) {
  const session = await requireUser()
  const where = { userId: session.user.id }
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ pageParam, totalItems })

  const listings = await prisma.listing.findMany({
    where,
    select: { ...listingSummarySelect, status: true, bumpedAt: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: pagination.skip,
    take: pagination.take
  })

  return {
    listings: listings.map((listing) => ({ ...toListingSummary(listing), status: listing.status, bumpedAt: listing.bumpedAt })),
    ...pagination
  }
}
