import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryTree } from '@/entities/category/get-category-tree'
import CreateListingForm from '@/features/create-listing/create-listing-form'
import type { ListingCategoryOption } from '@/features/create-listing/types'
import { requireUser } from '@/lib/auth-utils'
import { getListingPlan } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'

type CategoryNode = { id: string; name: string; children?: CategoryNode[] }

function categoryOptions(categories: CategoryNode[], prefix = ''): ListingCategoryOption[] {
  return categories.flatMap((category) => {
    const name = prefix ? `${prefix} / ${category.name}` : category.name
    return [{ id: category.id, name }, ...categoryOptions(category.children ?? [], name)]
  })
}

async function SellForm() {
  const session = await requireUser()
  const [categories, subscription, activeListingCount] = await Promise.all([
    getCategoryTree(),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.listing.count({ where: { userId: session.user.id, status: 'ACTIVE' } })
  ])

  return <CreateListingForm categories={categoryOptions(categories)} plan={getListingPlan(subscription)} activeListingCount={activeListingCount} />
}

export default function SellPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Post a listing</h1>
        <p className="text-muted-foreground">Turn something you no longer need into someone else’s next great find.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-2xl rounded-xl" />}>
        <SellForm />
      </Suspense>
    </div>
  )
}
