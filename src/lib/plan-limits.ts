import type { ListingStatus } from '@/generated/prisma/enums'

// Pending moderation reserves a slot before the listing becomes public.
export const LISTING_SLOT_STATUSES: ListingStatus[] = ['PENDING', 'ACTIVE']

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

export function getListingPlan(
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
