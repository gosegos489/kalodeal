import { useTranslations } from 'next-intl'
import { listingModerationReasons } from '@/features/moderation/listings/schema'
import type { ListingStatus } from '@/generated/prisma/enums'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'

export function ListingModerationFeedback({
  status,
  moderationReason,
  moderationMessage
}: {
  status: ListingStatus
  moderationReason: string | null
  moderationMessage: string | null
}) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  if (status !== 'CHANGES_REQUESTED' && status !== 'HIDDEN' && status !== 'REJECTED') return null
  const reason = listingModerationReasons.find(({ value }) => value === moderationReason)?.label
  return (
    <div className="bg-muted/40 flex min-w-0 flex-col gap-2 rounded-lg border p-3 text-sm" role="status">
      <p className="font-medium">
        {status === 'CHANGES_REQUESTED'
          ? t('actionRequiredEditYourListingAndSubmitItAgain')
          : status === 'HIDDEN'
            ? t('thisListingWasHiddenByModerationEditItAndSubmitItForReview')
            : t('thisListingWasRejectedAndCannotBeRepublished')}
      </p>
      {reason && <p className="text-muted-foreground">{copy(reason)}</p>}
      {moderationMessage && <p className="wrap-anywhere whitespace-pre-wrap">{moderationMessage}</p>}
    </div>
  )
}
