import { listingModerationReasons } from '@/features/moderation/schema'
import type { ListingStatus } from '@/generated/prisma/enums'

export function ListingModerationFeedback({
  status,
  moderationReason,
  moderationMessage
}: {
  status: ListingStatus
  moderationReason: string | null
  moderationMessage: string | null
}) {
  if (status !== 'CHANGES_REQUESTED' && status !== 'HIDDEN' && status !== 'REJECTED') return null
  const reason = listingModerationReasons.find(({ value }) => value === moderationReason)?.label
  return (
    <div className="bg-muted/40 flex min-w-0 flex-col gap-2 rounded-lg border p-3 text-sm" role="status">
      <p className="font-medium">
        {status === 'CHANGES_REQUESTED'
          ? 'Action required: edit your listing and submit it again.'
          : status === 'HIDDEN'
            ? 'This listing was hidden by moderation. Edit it and submit it for review.'
            : 'This listing was rejected and cannot be republished.'}
      </p>
      {reason && <p className="text-muted-foreground">{reason}</p>}
      {moderationMessage && <p className="wrap-anywhere whitespace-pre-wrap">{moderationMessage}</p>}
    </div>
  )
}
