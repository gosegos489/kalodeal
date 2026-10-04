import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { getAnalytics } from '@/features/analytics/data'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import AccountLoading from '../loading'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountAnalytics({ searchParams }: Props) {
  const params = await searchParams
  const analytics = await getAnalytics(params.period, params.page)

  // Check current server entitlements even when this URL is opened directly.
  if (!analytics.eligible) {
    return (
      <Card>
        <CardHeader>
          <LockKeyhole aria-hidden="true" className="text-primary mb-3 size-6" />
          <CardTitle>
            <h2>Analytics is a Pro feature</h2>
          </CardTitle>
          <CardDescription>Track views, favorites and phone reveals to understand buyer interest with Pro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/account/subscription" />}>
            Explore Pro
          </Button>
        </CardContent>
      </Card>
    )
  }

  const overview = analytics.overview
  const stats = [
    { label: 'Total views', value: overview.totalViews },
    { label: 'Favorites', value: overview.favorites },
    { label: 'Phone reveals', value: overview.phoneReveals },
    { label: 'Active listings', value: overview.active },
    { label: 'Pending listings', value: overview.pending },
    { label: 'Sold listings', value: overview.sold }
  ]

  return (
    <section aria-labelledby="analytics-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="analytics-heading" className="text-2xl font-semibold">
          Overview
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Views and phone reveals are all-time totals. Favorites and listing statuses show current counts. Phone reveals are actions, not unique
          contacts.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString('en')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Performance by listing</h3>
          </CardTitle>
          <CardDescription>
            View periods use UTC calendar days. View history begins when tracking is enabled; favorites and phone reveals remain all-time/current
            counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-5">
          <nav aria-label="Listing view period" className="flex flex-wrap gap-2">
            {(['all', '7', '30'] as const).map((period) => (
              <Button
                key={period}
                nativeButton={false}
                variant={analytics.period === period ? 'default' : 'outline'}
                size="sm"
                render={<Link href={`/account/analytics?period=${period}`} aria-current={analytics.period === period ? 'page' : undefined} />}
              >
                {period === 'all' ? 'All time' : `Last ${period} days`}
              </Button>
            ))}
          </nav>
          {overview.periodViews !== null && (
            <p role="status" className="text-sm font-medium">
              {overview.periodViews.toLocaleString('en')} views across your listings in the last {analytics.period} days.
            </p>
          )}
          {analytics.listings.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Your listings and their performance</caption>
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th scope="col" className="p-3">
                        Listing
                      </th>
                      <th scope="col" className="p-3">
                        Status
                      </th>
                      <th scope="col" className="p-3">
                        {analytics.period === 'all' ? 'Views (all time)' : `Views (${analytics.period} days)`}
                      </th>
                      <th scope="col" className="p-3">
                        Favorites (current)
                      </th>
                      <th scope="col" className="p-3">
                        Phone reveals (all time)
                      </th>
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
                        <td className="p-3 tabular-nums">{listing.favorites}</td>
                        <td className="p-3 tabular-nums">{listing.phoneReveals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NuqsPagination totalPages={analytics.totalPages} ariaLabel="Listing analytics pages" />
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Create your first listing to see its performance here.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default function AnalyticsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AccountLoading />}>
      <RouteAutoRefresh />
      <AccountAnalytics searchParams={searchParams} />
    </Suspense>
  )
}
