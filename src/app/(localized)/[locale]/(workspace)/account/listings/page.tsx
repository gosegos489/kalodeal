import { List, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ListingRowsSkeleton } from '@/entities/listing/ui/listing-skeleton'
import { getAccount, getMyListings } from '@/features/account/data'
import { MyListingRow } from '@/features/account/my-listing-row'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { serializePagination } from '@/lib/pagination'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import NuqsPagination from '@/shared/ui/workspace-pagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const listingsRowsClassName = 'flex min-w-0 flex-col gap-4'

async function MyListings({ searchParams }: Props) {
  const locale = await getLocale()

  const t = await getTranslations('Workspace')

  const params = await searchParams
  const [{ listings, page, pageSize, totalItems, totalPages }, account] = await Promise.all([getMyListings(params.page), getAccount()])

  // Keep the URL aligned with the rendered page, also after the last row is deleted.
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(localizeHref(`/account/listings${serializePagination(query, { page })}`, locale))
  }

  if (!listings.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <RouteAutoRefresh />
        <List aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">{t('youDonTHaveAnyListingsYet')}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{t('giveSomethingYouNoLongerNeedANewHomeCreateYourFirstListingToGetStarted')}</p>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus aria-hidden="true" /> {t('createYourFirstListing')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <RouteAutoRefresh />
      {account.monthlyBoosts > 0 || account.bonusBoostsRemaining > 0 ? (
        <p className="text-muted-foreground text-sm" role="status">
          {t('planBoosts')} {account.planBoostsRemaining} / {account.monthlyBoosts} {t('remainingBonusBoosts')} {account.bonusBoostsRemaining}{' '}
          {t('remaining300')}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t('plusIncludes')} {PLAN_LIMITS.PLUS.monthlyBoosts} {t('listingBoostsEachMonthToMoveYourActiveListingsTowardTheTopOfSearchResults')}{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            {t('comparePlans')}
          </Link>
        </p>
      )}
      {account.limits.featuredSlots > 0 && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('featuredListings')} {account.featuredUsed} / {account.limits.featuredSlots}{' '}
          {t('selectedPriorityInRelevantResultsWhileBusinessIsActiveNoBoostsUsed')}
        </p>
      )}
      <p className="text-muted-foreground text-sm" role="status">
        {t('showing')} {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} {t('of')} {totalItems} {t('listings')}
      </p>
      <div className={listingsRowsClassName}>
        {listings.map((listing) => (
          <MyListingRow
            key={listing.id}
            listing={listing}
            boostsRemaining={account.boostsRemaining}
            canBoost={account.boostsRemaining > 0}
            canFeature={account.limits.featuredSlots > 0}
          />
        ))}
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel={t('myListingsPages')} />
    </>
  )
}

export default function ListingsPage({ searchParams }: Props) {
  const t = useTranslations('Workspace')

  return (
    <section aria-labelledby="my-listings-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="my-listings-heading" className="text-2xl font-semibold">
            {t('myListings')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('seeYourPublishedListingsAndTheirCurrentStatus')}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus aria-hidden="true" /> {t('createListing')}
        </Button>
      </div>
      <Suspense fallback={<ListingRowsSkeleton label={t('loadingYourListings')} />}>
        <MyListings searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
