import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getAccount } from '@/features/account/data'
import CreateListingForm from '@/features/create-listing/create-listing-form'
import { getListingCategoryOptions } from '@/features/create-listing/get-category-options'

async function SellForm() {
  const [categories, account] = await Promise.all([getListingCategoryOptions(), getAccount()])

  return <CreateListingForm categories={categories} plan={account.plan} activeListingCount={account.activeCount} />
}

export default function SellPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <Link href="/account/listings" className="text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors">
          <ArrowLeft className="size-4" /> My listings
        </Link>
        <div className="flex flex-col gap-4 border-b pb-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-primary text-xs font-semibold uppercase">Sell on KaloDeal</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Give your item a new home.</h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed sm:text-base">
              Add a few photos, tell buyers what makes it great, and publish your listing.
            </p>
          </div>
          <Link href="/how-it-works" className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors">
            How selling works <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-3" role="status">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        }
      >
        <SellForm />
      </Suspense>
    </div>
  )
}
