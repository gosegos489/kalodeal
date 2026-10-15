import type { ListingStatus } from '@/generated/prisma/enums'

// Pending moderation and requested corrections reserve a slot before publication.
export const LISTING_SLOT_STATUSES: ListingStatus[] = ['PENDING', 'CHANGES_REQUESTED', 'ACTIVE']

export const PLAN_LIMITS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'EUR',
    activeListings: 1,
    imagesPerListing: 5,
    monthlyBoosts: 0,
    analyticsLevel: 'none',
    businessNameEnabled: false,
    featuredSlots: 0
  },
  PLUS: {
    name: 'Plus',
    price: 499,
    currency: 'EUR',
    activeListings: 3,
    imagesPerListing: 8,
    monthlyBoosts: 2,
    analyticsLevel: 'basic',
    businessNameEnabled: false,
    featuredSlots: 0
  },
  PRO: {
    name: 'Pro',
    price: 999,
    currency: 'EUR',
    activeListings: 10,
    imagesPerListing: 10,
    monthlyBoosts: 4,
    analyticsLevel: 'advanced',
    businessNameEnabled: false,
    featuredSlots: 0
  },
  BUSINESS: {
    name: 'Business',
    price: 1999,
    currency: 'EUR',
    activeListings: 20,
    imagesPerListing: 20,
    monthlyBoosts: 4,
    analyticsLevel: 'advanced',
    businessNameEnabled: true,
    featuredSlots: 10
  }
} as const

export type ListingPlan = keyof typeof PLAN_LIMITS
export type PaidPlan = Exclude<ListingPlan, 'FREE'>
export const PAID_PLANS: PaidPlan[] = ['PLUS', 'PRO', 'BUSINESS']
export const LISTING_PLANS: ListingPlan[] = ['FREE', ...PAID_PLANS]
export const MAX_LISTING_PHOTOS = Math.max(...LISTING_PLANS.map((plan) => PLAN_LIMITS[plan].imagesPerListing))

export function formatPlanPrice(plan: ListingPlan) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: PLAN_LIMITS[plan].currency }).format(PLAN_LIMITS[plan].price / 100)
}

export function getPaidListingPlan(
  subscription: { plan: ListingPlan; status: string; currentPeriodStart: Date; currentPeriodEnd: Date } | null,
  now = new Date()
): ListingPlan {
  return subscription &&
    subscription.plan !== 'FREE' &&
    ['ACTIVE', 'CANCELED'].includes(subscription.status) &&
    subscription.currentPeriodStart <= now &&
    subscription.currentPeriodEnd > now
    ? subscription.plan
    : 'FREE'
}

type ManualPlan = { plan: 'PRO'; startsAt: Date; endsAt: Date; revokedAt: Date | null }
export function isActivePlanGrant(grant: ManualPlan | null, now = new Date()) {
  return !!grant && grant.plan === 'PRO' && grant.startsAt <= now && grant.endsAt > now && grant.revokedAt === null
}

// Complimentary Pro may augment Plus/Free but never replaces paid Business.
export function getListingPlan(
  subscription: Parameters<typeof getPaidListingPlan>[0],
  now = new Date(),
  manualGrant: ManualPlan | null = null
): ListingPlan {
  const paid = getPaidListingPlan(subscription, now)
  return isActivePlanGrant(manualGrant, now) && PLAN_LIMITS[paid].price < PLAN_LIMITS.PRO.price ? 'PRO' : paid
}

export const COMPLIMENTARY_BOOST_PERIOD_MS = 30 * 24 * 60 * 60 * 1000
export function getComplimentaryBoostPeriod(grant: { startsAt: Date; endsAt: Date; boostPeriodStart: Date; boostsUsed: number }, now: Date) {
  const window = Math.floor(Math.max(0, now.getTime() - grant.startsAt.getTime()) / COMPLIMENTARY_BOOST_PERIOD_MS)
  const startsAt = new Date(grant.startsAt.getTime() + window * COMPLIMENTARY_BOOST_PERIOD_MS)
  return {
    startsAt,
    endsAt: new Date(Math.min(startsAt.getTime() + COMPLIMENTARY_BOOST_PERIOD_MS, grant.endsAt.getTime())),
    used: grant.boostPeriodStart.getTime() === startsAt.getTime() ? grant.boostsUsed : 0
  }
}
