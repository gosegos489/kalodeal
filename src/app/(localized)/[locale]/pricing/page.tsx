import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { getBillingAvailability } from '@/features/billing/config'
import { PlanComparison } from '@/features/billing/plan-comparison'
import { PlanComparisonSkeleton } from '@/features/billing/plan-comparison-skeleton'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession } from '@/lib/auth-utils'
import { buildMetadata } from '@/lib/metadata'
import { PAID_PLANS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'

export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Pricing' })
  return buildMetadata({ title: t('metadataTitle'), description: t('metadataDescription'), path: '/pricing', locale, localized: true })
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function PricingPlans({ searchParams }: Props) {
  const params = await searchParams
  const selectedPlan = PAID_PLANS.find((plan) => plan === params.plan)
  const session = await getSession(true)
  const [access, available] = await Promise.all([session ? getUserAccess(prisma, session.user.id) : Promise.resolve(null), getBillingAvailability()])
  return (
    <PlanComparison
      authenticated={!!session}
      marketplaceAllowed={!session || canUseMarketplace(session.user.role)}
      currentPlan={access?.plan ?? 'FREE'}
      paidPlan={access?.paidPlan ?? 'FREE'}
      hasSubscription={!!access?.subscription?.stripeSubscriptionId && access.subscription.status !== 'EXPIRED'}
      available={available}
      selectedPlan={selectedPlan}
    />
  )
}

export default async function PricingPage({ searchParams }: Props) {
  const t = await getTranslations('Pricing')
  return (
    <div className="container flex flex-col gap-10 py-12 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('heading')}</h1>
        <p className="text-muted-foreground mt-4 text-lg">{t('intro')}</p>
      </div>
      <Suspense fallback={<PlanComparisonSkeleton />}>
        <PricingPlans searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
