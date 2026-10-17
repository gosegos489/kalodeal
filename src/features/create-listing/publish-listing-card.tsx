import { ArrowRight, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { needsListingResubmission } from '@/entities/listing/lifecycle'
import type { ListingStatus } from '@/generated/prisma/enums'
import { localizeHref } from '@/i18n/routing'

type PublishListingCardProps = {
  isSubmitting: boolean
  disabled: boolean
  editingStatus?: ListingStatus
}

export function PublishListingCard({ isSubmitting, disabled, editingStatus }: PublishListingCardProps) {
  const t = useTranslations('Workspace')
  const locale = useLocale()

  const editing = editingStatus !== undefined
  const resubmitting = editingStatus !== undefined && needsListingResubmission(editingStatus)
  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-xs">
      <h2 className="font-semibold">{editing ? t('saveYourChanges') : t('readyToPublish')}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {resubmitting
          ? t('applyTheRequestedCorrectionsIncludingAnyPhotoChangesThenSubmitTheCompletedListingForR')
          : editingStatus === 'ACTIVE' || editingStatus === 'INACTIVE'
            ? t('changingListingDetailsOrPhotosSendsItBackToModerationItWillBeVisibleToBuyersAgainAfte')
            : editing
              ? t('checkYourUpdatedDetailsBeforeSavingYourCurrentListingStatusWillBeKept')
              : t('checkYourDetailsOneLastTimeYourListingWillBeVisibleToBuyersAfterModeratorApproval')}
      </p>
      <Button className="h-11 w-full cursor-pointer gap-2" size="lg" type="submit" disabled={disabled}>
        {isSubmitting ? <Loader2 className="size-4 motion-safe:animate-spin" /> : <ArrowRight className="size-4" />}
        {isSubmitting
          ? resubmitting
            ? t('submittingPending')
            : editing
              ? t('savingPending')
              : t('publishingPending')
          : resubmitting
            ? t('submitForReview')
            : editing
              ? t('saveChanges')
              : t('publishListing')}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        {t('youCanManageYourListingIn')} <Link href={localizeHref('/account/listings', locale)}>{t('myListings')}</Link>.
      </p>
    </section>
  )
}
