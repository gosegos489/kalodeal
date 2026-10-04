import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import type { ListingStatus } from '@/generated/prisma/enums'
import { LISTING_SLOT_STATUSES, PLAN_LIMITS } from './plan-limits'
import { getUserAccess } from './user-access'

export class ListingSlotError extends Error {}

// The caller must hold the owner's user-row FOR UPDATE lock, matching creation
// and billing. Re-entry into a reserved status must not bypass the plan limit.
export async function checkListingSlotAvailable(tx: Prisma.TransactionClient, userId: string, previous: ListingStatus, next: ListingStatus) {
  if (LISTING_SLOT_STATUSES.includes(previous) || !LISTING_SLOT_STATUSES.includes(next)) return
  const [access, count] = await Promise.all([
    getUserAccess(tx, userId),
    tx.listing.count({ where: { userId, status: { in: LISTING_SLOT_STATUSES } } })
  ])
  if (count >= PLAN_LIMITS[access.plan].activeListings) {
    throw new ListingSlotError('You have reached your listing limit, including listings awaiting moderation or changes. Free a slot and try again.')
  }
}
