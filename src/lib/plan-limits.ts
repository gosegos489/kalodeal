import type { ListingStatus } from '@/generated/prisma/enums'

// Pending moderation and requested corrections reserve a slot before publication.
export const LISTING_SLOT_STATUSES: ListingStatus[] = ['PENDING', 'CHANGES_REQUESTED', 'ACTIVE']

export const PLAN_LIMITS = {
  FREE: {
    activeListings: 1,
    imagesPerListing: 3,
    monthlyBumps: 0,
    advancedStats: false
  },
  PRO: {
    activeListings: 10,
    imagesPerListing: 10,
    monthlyBumps: 4,
    advancedStats: true
  }
} as const

export type ListingPlan = keyof typeof PLAN_LIMITS

export function getPaidListingPlan(
  subscription: { plan: ListingPlan; status: string; currentPeriodStart: Date; currentPeriodEnd: Date } | null,
  now = new Date()
): ListingPlan {
  return subscription?.plan === 'PRO' &&
    ['ACTIVE', 'CANCELED'].includes(subscription.status) &&
    subscription.currentPeriodStart <= now &&
    subscription.currentPeriodEnd > now
    ? 'PRO'
    : 'FREE'
}

type ManualPlan = { plan: 'PRO'; startsAt: Date; endsAt: Date; revokedAt: Date | null }

export function isActivePlanGrant(grant: ManualPlan | null, now = new Date()) {
  return !!grant && grant.plan === 'PRO' && grant.startsAt <= now && grant.endsAt > now && grant.revokedAt === null
}

// One effective-plan calculation. Bonus bumps never participate in this policy.
export function getListingPlan(
  subscription: Parameters<typeof getPaidListingPlan>[0],
  now = new Date(),
  manualGrant: ManualPlan | null = null
): ListingPlan {
  return getPaidListingPlan(subscription, now) === 'PRO' || isActivePlanGrant(manualGrant, now) ? 'PRO' : 'FREE'
}

export const COMPLIMENTARY_BUMP_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

export function getComplimentaryBumpPeriod(grant: { startsAt: Date; endsAt: Date; bumpPeriodStart: Date; bumpUsed: number }, now: Date) {
  const window = Math.floor(Math.max(0, now.getTime() - grant.startsAt.getTime()) / COMPLIMENTARY_BUMP_PERIOD_MS)
  const startsAt = new Date(grant.startsAt.getTime() + window * COMPLIMENTARY_BUMP_PERIOD_MS)
  return {
    startsAt,
    endsAt: new Date(Math.min(startsAt.getTime() + COMPLIMENTARY_BUMP_PERIOD_MS, grant.endsAt.getTime())),
    used: grant.bumpPeriodStart.getTime() === startsAt.getTime() ? grant.bumpUsed : 0
  }
}
