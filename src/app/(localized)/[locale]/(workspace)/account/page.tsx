import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAccount } from '@/features/account/data'
import { Link } from '@/i18n/navigation'
import AccountLoading from './loading'

async function AccountOverview() {
  const t = await getTranslations('Workspace')

  const account = await getAccount()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold wrap-break-word">
            {t('welcome')} {account.user.name}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('hereIsAnOverviewOfYourAccount')}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/sell" />}>
          <Plus /> {t('createListing')}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('usedListingSlots')}</CardTitle>
            <CardDescription>{t('publishedListingsAndListingsAwaitingModerationOrChanges')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-3xl font-semibold tabular-nums">
              {account.listingSlotCount}
              <span className="text-muted-foreground text-lg"> / {account.limits.activeListings}</span>
            </p>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/listings" />}>
              {t('myListings')}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('currentPlan')}</CardTitle>
            <CardDescription>{account.plan !== 'FREE' ? t('forRegularAndProfessionalSellers') : t('forOccasionalSellers')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <Badge>{account.limits.name}</Badge>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>
                {t('upTo')} {account.limits.imagesPerListing} {t('photosPerListing262')}
              </li>
              <li>
                {account.limits.monthlyBoosts > 0
                  ? t('valueListingBoostsEachMonth', { value0: account.limits.monthlyBoosts })
                  : t('standardListingPlacement')}
              </li>
              <li>
                {account.limits.analyticsLevel === 'none'
                  ? t('basicAccountToolsIncluded')
                  : t('valueListingAnalyticsIncluded', { value0: account.limits.analyticsLevel === 'basic' ? t('basic') : t('advanced') })}
              </li>
            </ul>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/subscription" />}>
              {t('viewMyPlan')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountOverview />
    </Suspense>
  )
}
