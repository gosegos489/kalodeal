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

export const metadata = buildMetadata({
  title: 'Pricing',
  description: 'Compare Free, Plus, Pro and Business monthly selling plans, Boosts, Featured Listings and analytics.',
  path: '/pricing'
})

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

export default function PricingPage({ searchParams }: Props) {
  return (
    <div className="container flex flex-col gap-10 py-12 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose the plan that fits how you sell</h1>
        <p className="text-muted-foreground mt-4 text-lg">Monthly plans in EUR. Start free and choose more tools as your selling grows.</p>
      </div>
      <Suspense fallback={<PlanComparisonSkeleton />}>
        <PricingPlans searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
