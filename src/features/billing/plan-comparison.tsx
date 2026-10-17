import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { localizeHref } from '@/i18n/routing'
import { LISTING_PLANS, type ListingPlan, PLAN_LIMITS, type PaidPlan, formatPlanPrice } from '@/lib/plan-limits'
import { cn } from '@/lib/utils'
import { BillingButton } from './billing-button'
import { getBillingLabels } from './get-billing-labels'
import { pricingCtaClassName } from './pricing-cta'

type Props = {
  currentPlan: ListingPlan
  paidPlan: ListingPlan
  authenticated?: boolean
  marketplaceAllowed?: boolean
  hasSubscription?: boolean
  available: Partial<Record<ListingPlan, boolean>>
  selectedPlan?: PaidPlan
}
export async function PlanComparison({
  currentPlan,
  paidPlan,
  authenticated = true,
  marketplaceAllowed = true,
  hasSubscription = false,
  available,
  selectedPlan
}: Props) {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Pricing' })
  const billingLabels = await getBillingLabels()
  return (
    <section aria-label={t('compare')} className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {LISTING_PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan]
          const isCurrent = authenticated && currentPlan === plan
          const price = formatPlanPrice(plan, 'symbol', locale)
          const isSelected = selectedPlan === plan
          return (
            <Card key={plan} className={cn('flex h-full flex-col', isSelected && 'ring-primary ring-2')}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <h2>{limits.name}</h2>
                  {isCurrent && <Badge variant="outline">{t('yourPlan')}</Badge>}
                  {isSelected && !isCurrent && <Badge variant="outline">{t('selectedPlan')}</Badge>}
                </CardTitle>
                <CardDescription>{t(`descriptions.${plan}`)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <p className="text-3xl font-semibold">
                  {price}
                  <span className="text-muted-foreground text-sm font-normal"> / {t('month')}</span>
                </p>
                <ul className="flex flex-col gap-3 text-sm">
                  <li>{t('activeListings', { count: limits.activeListings })}</li>
                  <li>{t('photos', { count: limits.imagesPerListing })}</li>
                  <li>{t('basicTools')}</li>
                  <li>{limits.monthlyBoosts ? t('monthlyBoosts', { count: limits.monthlyBoosts }) : t('standardPlacement')}</li>
                  <li>
                    {limits.analyticsLevel === 'none'
                      ? t('noAnalytics')
                      : limits.analyticsLevel === 'basic'
                        ? t('basicAnalytics')
                        : t('advancedAnalytics')}
                  </li>
                  {plan === 'FREE' && <li>{t('noSubscription')}</li>}
                  {plan === 'BUSINESS' && (
                    <>
                      <li>{t('allPro')}</li>
                      <li>{t('businessName')}</li>
                      <li>{t('featuredSlots', { count: limits.featuredSlots })}</li>
                      <li>{t('featuredPriority')}</li>
                    </>
                  )}
                </ul>
                <div className="mt-auto flex w-full flex-col items-stretch gap-3 pt-2">
                  {!marketplaceAllowed ? (
                    <p className="text-muted-foreground text-sm">{t('marketplaceOnly')}</p>
                  ) : plan !== 'FREE' && !available[plan] && paidPlan !== plan ? (
                    <div role="status" className="flex flex-col gap-2">
                      <Button disabled className={pricingCtaClassName}>
                        {t('unavailable')}
                      </Button>
                      <p className="sr-only">{t('unavailableHelp')}</p>
                    </div>
                  ) : !authenticated ? (
                    <Button
                      nativeButton={false}
                      className={pricingCtaClassName}
                      render={
                        <Link
                          href={localizeHref(
                            `/login?returnTo=${encodeURIComponent(localizeHref(plan === 'FREE' ? '/pricing' : `/pricing?plan=${plan}`, locale))}`,
                            locale
                          )}
                        />
                      }
                    >
                      {plan === 'FREE' ? t('getStarted') : t('upgradePrice', { plan: limits.name, price })}
                    </Button>
                  ) : plan === 'FREE' ? (
                    currentPlan === 'FREE' ? (
                      <Button disabled className={pricingCtaClassName}>
                        {t('yourPlan')}
                      </Button>
                    ) : hasSubscription ? (
                      <BillingButton
                        locale={locale}
                        intent="manage"
                        className={pricingCtaClassName}
                        labels={billingLabels}
                        upgradeLabel={t('switchFree')}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">{t('complimentaryEnds')}</p>
                    )
                  ) : paidPlan === plan ? (
                    <Button disabled className={pricingCtaClassName}>
                      {t('yourPaidPlan')}
                    </Button>
                  ) : hasSubscription ? (
                    <BillingButton
                      locale={locale}
                      intent="manage"
                      className={pricingCtaClassName}
                      labels={billingLabels}
                      upgradeLabel={t('changePlan', { plan: limits.name })}
                    />
                  ) : available[plan] ? (
                    <BillingButton
                      locale={locale}
                      intent="upgrade"
                      className={pricingCtaClassName}
                      plan={plan}
                      labels={billingLabels}
                      upgradeLabel={t(isSelected ? 'continuePrice' : isCurrent ? 'startPaidPrice' : 'upgradePrice', { plan: limits.name, price })}
                    />
                  ) : (
                    <Button disabled className={pricingCtaClassName}>
                      {t('unavailable')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{t('billingExplanation')}</p>
      {hasSubscription && <p className="text-muted-foreground text-sm">{t('planChanges')}</p>}
    </section>
  )
}
