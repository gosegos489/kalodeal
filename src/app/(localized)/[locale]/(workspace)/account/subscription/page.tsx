import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountPlanSkeleton } from '@/features/account/account-skeleton'
import { getAccount } from '@/features/account/data'
import { BillingButton } from '@/features/billing/billing-button'
import { CheckoutPending } from '@/features/billing/checkout-pending'
import { formatPlanPrice } from '@/features/billing/format-plan-price'
import { getBillingLabels } from '@/features/billing/get-billing-labels'
import { Link } from '@/i18n/navigation'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function AccountSubscription({ searchParams }: Props) {
  const t = await getTranslations('Workspace')
  const locale = await getLocale()
  const format = await getFormatter({ locale })

  const billingLabels = await getBillingLabels()
  const account = await getAccount()
  const params = await searchParams

  return (
    <div className="flex flex-col gap-6">
      <RouteAutoRefresh />
      {params.checkout === 'success' && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3" role="status">
            {account.paidPlan !== 'FREE' ? <p>{t('yourPaidPlanIsActive')}</p> : <CheckoutPending />}
          </CardContent>
        </Card>
      )}
      {params.checkout === 'canceled' && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('checkoutWasCanceledYourCurrentPlanIsShownBelow')}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t('currentPlan')}</h2>
          </CardTitle>
          <CardDescription>{t('yourCurrentBenefitsAndUsageCompareSellingPlansOnThePricingPage')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <Badge>
            {account.limits.name} {t('plan')}
          </Badge>
          <p className="text-2xl font-semibold">
            {account.plan === 'FREE' ? (
              <span className="text-muted-foreground text-base font-normal">{t('noSubscriptionRequired')}</span>
            ) : account.plan !== account.paidPlan ? (
              <span className="text-muted-foreground text-base font-normal">{t('complimentaryProAccess')}</span>
            ) : (
              <>
                {formatPlanPrice(account.plan, locale)}
                <span className="text-muted-foreground text-sm font-normal"> {t('monthStandardPlanPrice')}</span>
              </>
            )}
          </p>
          <dl className="grid w-full gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">{t('activeListingAllowance')}</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.listingSlotCount} / {account.limits.activeListings}
                <p className="text-muted-foreground mt-1 text-xs font-normal">{t('includesPendingListingsAndRequestedCorrections')}</p>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t('photosPerListing')}</dt>
              <dd className="mt-1 text-lg font-semibold">{account.limits.imagesPerListing}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t('listingAnalytics')}</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.limits.analyticsLevel === 'none' ? t('notIncluded') : account.limits.analyticsLevel === 'basic' ? t('basic') : t('advanced')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t('monthlyBoosts')}</dt>
              <dd className="mt-1 text-lg font-semibold">{account.monthlyBoosts}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t('remainingMonthlyBoosts')}</dt>
              <dd className="mt-1 text-lg font-semibold">{account.planBoostsRemaining}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">{t('bonusBoosts')}</dt>
              <dd className="mt-1 text-lg font-semibold">
                {account.bonusBoostsRemaining} {t('remaining')}
              </dd>
            </div>
            {account.boostPeriodEndsAt && (
              <div>
                <dt className="text-muted-foreground text-sm">{t('currentPlanBoostWindowEnds')}</dt>
                <dd className="mt-1 font-medium">{format.dateTime(account.boostPeriodEndsAt, 'utcDateTime')} UTC</dd>
              </div>
            )}
            {account.limits.featuredSlots > 0 && (
              <div>
                <dt className="text-muted-foreground text-sm">{t('featuredListingSlots')}</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {account.featuredUsed} / {account.limits.featuredSlots} {t('used')}{' '}
                  {Math.max(0, account.limits.featuredSlots - account.featuredUsed)} {t('remaining')}
                </dd>
              </div>
            )}
          </dl>
          {account.listingSlotCount > account.limits.activeListings && (
            <p role="status" className="text-muted-foreground text-sm">
              {t('yourAccountIsOverTheCurrentListingLimitTheOldestReservedSlotsRemainEligibleForPublica')}
            </p>
          )}
          {account.complimentaryGrant && (
            <div className="bg-muted w-full rounded-lg p-4" role="status">
              <p className="font-medium">{t('complimentaryProAccess')}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t('availableUntil')}{' '}
                <time dateTime={account.complimentaryGrant.endsAt.toISOString()}>
                  {format.dateTime(account.complimentaryGrant.endsAt, 'utcDateTime')} UTC
                </time>
                {t('complimentaryBoostsRenewEvery30DaysDuringThisAccessWithoutCarryover')}
                {account.planBoostSource === 'paid' && t('yourPaidSubscriptionSuppliesThePlanBoostAllowanceWhileItIsActive')}
              </p>
            </div>
          )}
          {account.subscription?.hasStripeSubscription && (
            <dl className="grid w-full gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">{t('subscriptionStatus')}</dt>
                <dd className="mt-1 font-medium">
                  {['past_due', 'unpaid'].includes(account.subscription.stripeStatus ?? '')
                    ? t('paymentPastDue')
                    : account.paidPlan !== 'FREE'
                      ? account.subscription.status === 'CANCELED'
                        ? t('canceling')
                        : t('active')
                      : account.subscription.status === 'PAST_DUE'
                        ? t('paymentPastDue')
                        : account.subscription.currentPeriodEnd.getTime() > 0
                          ? t('expired')
                          : t('awaitingPayment')}
                </dd>
              </div>
              {account.subscription.currentPeriodEnd.getTime() > 0 && (
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {account.paidPlan !== 'FREE'
                      ? account.subscription.status === 'CANCELED'
                        ? t('accessRemainsActiveUntil')
                        : t('renewsOn')
                      : t('paidPeriodEnds')}
                  </dt>
                  <dd className="mt-1 font-medium">
                    <time dateTime={account.subscription.currentPeriodEnd.toISOString()}>
                      {format.dateTime(account.subscription.currentPeriodEnd, 'utcDateTime')} UTC
                    </time>
                  </dd>
                </div>
              )}
            </dl>
          )}
          {account.paidPlan !== 'FREE' && account.subscription?.status === 'CANCELED' && (
            <p className="text-muted-foreground text-sm">{t('yourPaidPlanRemainsAvailableUntilThePaidPeriodEndsYourSubscriptionWillNotRenew')}</p>
          )}
          {account.subscription?.hasStripeSubscription && (
            <p className="text-muted-foreground text-sm">
              {t('yourCurrentBillingAmountAndAnyScheduledPlanChangeAreShownInStripeBillingExistingSubsc')}
            </p>
          )}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} className="h-auto min-h-11 w-full px-4 py-3 whitespace-normal" render={<Link href="/pricing" />}>
              {t('viewAllPlans')}
            </Button>
            {account.subscription?.hasStripeSubscription && (
              <BillingButton intent="manage" locale={locale} upgradeLabel={t('manageSubscription')} labels={billingLabels} />
            )}
            {account.limits.analyticsLevel !== 'none' && (
              <Button nativeButton={false} className="h-auto min-h-11 px-4 py-3" variant="outline" render={<Link href="/account/analytics" />}>
                {t('analytics')}
              </Button>
            )}
          </div>
          {account.subscription?.hasStripeSubscription && (
            <p className="text-muted-foreground text-sm">{t('managePaymentDetailsPlanChangesAndCancellationInSubscriptionBilling')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AccountPlanSkeleton />}>
      <AccountSubscription searchParams={searchParams} />
    </Suspense>
  )
}
