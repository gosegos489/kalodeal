import { LockKeyhole } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountAnalyticsSkeleton } from '@/features/account/account-skeleton'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { getAnalytics } from '@/features/analytics/data'
import { Link } from '@/i18n/navigation'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import NuqsPagination from '@/shared/ui/workspace-pagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountAnalytics({ searchParams }: Props) {
  const t = await getTranslations('Workspace')
  const locale = await getLocale()
  const copy = createWorkspaceCopy(t)

  const params = await searchParams
  const analytics = await getAnalytics(params.period, params.page)

  // Check current server entitlements even when this URL is opened directly.
  if (!analytics.eligible) {
    return (
      <Card>
        <CardHeader>
          <LockKeyhole aria-hidden="true" className="text-primary mb-3 size-6" />
          <CardTitle>
            <h2>{t('analyticsStartsWithPlus')}</h2>
          </CardTitle>
          <CardDescription>{t('trackViewsWithPlusAndAddFavoritesAndPhoneRevealsWithProOrBusiness')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/pricing" />}>
            {t('comparePlans')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const overview = analytics.overview
  const stats = [
    { label: t('totalViews'), value: overview.totalViews },
    ...(analytics.advanced
      ? [
          { label: t('favorites138'), value: overview.favorites ?? 0 },
          { label: t('phoneReveals'), value: overview.phoneReveals ?? 0 }
        ]
      : []),
    { label: t('activeListings'), value: overview.active },
    { label: t('pendingListings'), value: overview.pending },
    { label: t('soldListings'), value: overview.sold }
  ]

  return (
    <section aria-labelledby="analytics-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="analytics-heading" className="text-2xl font-semibold">
          {t('overview')}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {t('viewsAreAllTimeTotalsListingStatusesShowCurrentCounts')}
          {analytics.advanced && t('favoritesShowCurrentCountsPhoneRevealsAreAllTimeActionsNotUniqueContacts')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={copy(label)}>
            <CardHeader>
              <CardTitle>{copy(label)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString(locale)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>{t('performanceByListing')}</h3>
          </CardTitle>
          <CardDescription>{t('viewPeriodsUseUTCCalendarDaysViewHistoryBeginsWhenTrackingIsEnabledFavoritesAndPhoneR')}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-5">
          <nav aria-label={t('listingViewPeriod')} className="flex flex-wrap gap-2">
            {(['all', '7', '30'] as const).map((period) => (
              <Button
                key={period}
                nativeButton={false}
                variant={analytics.period === period ? 'default' : 'outline'}
                size="sm"
                render={<Link href={`/account/analytics?period=${period}`} aria-current={analytics.period === period ? 'page' : undefined} />}
              >
                {period === 'all' ? t('allTime') : t('lastValueDays', { value0: period })}
              </Button>
            ))}
          </nav>
          {overview.periodViews !== null && (
            <p role="status" className="text-sm font-medium">
              {overview.periodViews.toLocaleString(locale)} {t('viewsAcrossYourListingsInTheLast')} {analytics.period} {t('days')}
            </p>
          )}
          {analytics.listings.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t('yourListingsAndTheirPerformance')}</caption>
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th scope="col" className="p-3">
                        {t('listing166')}
                      </th>
                      <th scope="col" className="p-3">
                        {t('status')}
                      </th>
                      <th scope="col" className="p-3">
                        {analytics.period === 'all' ? t('viewsAllTime') : t('viewsValueDays', { value0: analytics.period })}
                      </th>
                      {analytics.advanced && (
                        <>
                          <th scope="col" className="p-3">
                            {t('favoritesCurrent')}
                          </th>
                          <th scope="col" className="p-3">
                            {t('phoneRevealsAllTime')}
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.listings.map((listing) => (
                      <tr key={listing.id} className="border-b last:border-b-0">
                        <th scope="row" className="max-w-xs p-3 font-medium">
                          <Link href={`/listings/${listing.id}`} className="text-primary wrap-anywhere underline-offset-4 hover:underline">
                            {listing.title}
                          </Link>
                        </th>
                        <td className="p-3">
                          <ListingStatusBadge status={listing.status} />
                        </td>
                        <td className="p-3 tabular-nums">{listing.views}</td>
                        {analytics.advanced && (
                          <>
                            <td className="p-3 tabular-nums">{listing.favorites}</td>
                            <td className="p-3 tabular-nums">{listing.phoneReveals}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NuqsPagination totalPages={analytics.totalPages} ariaLabel={t('analyticsPages')} />
            </>
          ) : (
            <p className="text-muted-foreground text-sm">{t('createYourFirstListingToSeeItsPerformanceHere')}</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default function AnalyticsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AccountAnalyticsSkeleton />}>
      <RouteAutoRefresh />
      <AccountAnalytics searchParams={searchParams} />
    </Suspense>
  )
}
