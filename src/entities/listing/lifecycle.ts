import type { ListingStatus } from '@/generated/prisma/enums'

export const listingStatusLabels = {
  PENDING: 'Awaiting approval',
  CHANGES_REQUESTED: 'Changes requested',
  ACTIVE: 'Published',
  INACTIVE: 'Hidden by owner',
  HIDDEN: 'Hidden by moderation',
  REJECTED: 'Rejected',
  SOLD: 'Sold'
} satisfies Record<ListingStatus, string>

export type OwnerListingAction = 'hide' | 'unhide' | 'mark-sold'
export type ListingModerationDecision = 'approve' | 'request-changes' | 'reject' | 'hide'

export function getOwnerStatusTransition(status: ListingStatus, action: OwnerListingAction): ListingStatus | null {
  if (action === 'hide' && status === 'ACTIVE') return 'INACTIVE'
  if (action === 'unhide' && status === 'INACTIVE') return 'ACTIVE'
  if (action === 'mark-sold' && (status === 'ACTIVE' || status === 'INACTIVE')) return 'SOLD'
  return null
}

// INACTIVE retains approval only while the owner has changed visibility alone.
export function getEditedListingStatus(status: ListingStatus): ListingStatus {
  return status === 'ACTIVE' || status === 'INACTIVE' ? 'PENDING' : status
}

// Photos in a correction workflow are saved immediately, but the owner explicitly
// submits the completed listing from the details form before it re-enters the queue.
export function needsListingResubmission(status: ListingStatus) {
  return status === 'CHANGES_REQUESTED' || status === 'HIDDEN'
}

export function getModerationStatusTransition(status: ListingStatus, decision: ListingModerationDecision): ListingStatus | null {
  if (status === 'ACTIVE' && decision === 'hide') return 'HIDDEN'
  if (status !== 'PENDING') return null
  if (decision === 'approve') return 'ACTIVE'
  if (decision === 'request-changes') return 'CHANGES_REQUESTED'
  if (decision === 'reject') return 'REJECTED'
  return null
}
