import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getListingCategoryOptions } from '@/features/create-listing/get-category-options'
import { ListingForm } from '@/features/create-listing/listing-form'
import { getEditableListing } from '@/features/edit-listing/data'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Edit listing', robots: { index: false, follow: false } }

async function EditListing({ params }: Props) {
  const { id } = await params
  const [listing, categories] = await Promise.all([getEditableListing(id), getListingCategoryOptions()])
  if (!listing) notFound()
  const { categoryName, ...editableListing } = listing
  // Keep the current value visible even if its category is no longer in navigation.
  const options = categories.some((category) => category.id === listing.values.categoryId)
    ? categories
    : [{ id: listing.values.categoryId, name: `${categoryName} (current category)` }, ...categories]

  return <ListingForm mode="edit" key={`${listing.id}:${listing.updatedAt}`} categories={options} listing={editableListing} />
}

export default function EditListingPage({ params }: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby="edit-listing-heading">
      <Link href="/account/listings" className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" /> My listings
      </Link>
      <div>
        <h2 id="edit-listing-heading" className="text-2xl font-semibold">
          Edit listing
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Update your item details and contact information.</p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-3" role="status" aria-label="Loading listing form">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
            <span className="sr-only">Loading listing form...</span>
          </div>
        }
      >
        <EditListing params={params} />
      </Suspense>
    </section>
  )
}
