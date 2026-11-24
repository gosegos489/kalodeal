import { ArrowRight, Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { localizeHref } from '@/i18n/routing'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'

type ListingAllowanceCardProps = {
  plan: ListingPlan
  listingSlotCount: number
  categoriesAvailable: boolean
}

export function ListingAllowanceCard({ plan, listingSlotCount, categoriesAvailable }: ListingAllowanceCardProps) {
  const t = useTranslations('Workspace')
  const locale = useLocale()

  const limits = PLAN_LIMITS[plan]
  const limitReached = listingSlotCount >= limits.activeListings
  const availableListingCount = limits.activeListings - listingSlotCount

  return (
    <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{t('yourListingAllowance')}</h2>
        <span className="bg-primary/8 text-primary rounded-full px-3 py-1 text-xs font-semibold">{limits.name}</span>
      </div>

      <div className="grid grid-cols-2 divide-x rounded-xl border py-4">
        <div className="flex flex-col gap-1 px-4">
          <p className="text-2xl font-semibold tabular-nums">
            {listingSlotCount}
            <span className="text-muted-foreground text-base font-normal"> / {limits.activeListings}</span>
          </p>
          <p className="text-muted-foreground text-xs">{t('usedListingSlots')}</p>
        </div>
        <div className="flex flex-col gap-1 px-4">
          <p className="text-2xl font-semibold tabular-nums">{limits.imagesPerListing}</p>
          <p className="text-muted-foreground text-xs">{t('photosPerListing')}</p>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">{t('publishedListingsAndListingsAwaitingModerationOrChangesCountTowardYourLimitUploadUpTo')}</p>

      <div className="flex flex-col gap-3 text-sm">
        {limitReached ? (
          <p className="text-destructive leading-relaxed">
            {t('youHaveReachedYourListingLimitIncludingListingsAwaitingModerationOrChanges')}{' '}
            <Link href={localizeHref('/account/listings', locale)} className="font-medium">
              {t('manageYourListings')}
            </Link>{' '}
            {t('or')}{' '}
            <Link href={localizeHref('/account/subscription', locale)} className="font-medium">
              {t('viewYourPlan')}
            </Link>
            .
          </p>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2">
            <Check className="text-primary size-4 shrink-0" /> {t('availableListingSlots', { count: availableListingCount })}
          </p>
        )}
        {!categoriesAvailable && <p className="text-destructive">{t('categoriesAreCurrentlyUnavailablePleaseTryAgainLater')}</p>}
      </div>

      <Link href={localizeHref('/account/subscription', locale)} className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
        {plan !== 'FREE' ? t('manageYourPlan') : t('explorePlans')} <ArrowRight className="size-3.5" />
      </Link>
    </section>
  )
}
