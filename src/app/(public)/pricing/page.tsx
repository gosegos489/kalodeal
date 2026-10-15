import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getBillingAvailability } from '@/features/billing/config'
import { PlanComparison } from '@/features/billing/plan-comparison'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession } from '@/lib/auth-utils'
import { buildMetadata } from '@/lib/metadata'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'

export const metadata = buildMetadata({
  title: 'Pricing',
  description: 'Compare Free, Plus, Pro and Business monthly selling plans, Boosts, Featured Listings and analytics.',
  path: '/pricing'
})

async function PricingPlans() {
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
    />
  )
}

export default function PricingPage() {
  return (
    <div className="container flex flex-col gap-10 py-12 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose the plan that fits how you sell</h1>
        <p className="text-muted-foreground mt-4 text-lg">Monthly plans in EUR. Start free and choose more tools as your selling grows.</p>
      </div>
      <Suspense
        fallback={
          <div role="status" aria-label="Loading plans" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        }
      >
        <PricingPlans />
      </Suspense>
    </div>
  )
}
