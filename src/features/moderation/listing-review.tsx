import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatListingPrice } from '@/entities/listing/format-price'
import { ListingGallery } from '@/entities/listing/ui/listing-gallery'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { dayjs } from '@/lib/dayjs'
import { getModerationListing } from './data'
import { ListingModerationControls } from './listing-moderation-controls'

export async function ListingReview({ id }: { id: string }) {
  const listing = await getModerationListing(id)
  if (!listing) notFound()
  const details = [
    { label: 'Seller', value: listing.seller.name },
    { label: 'Seller email', value: listing.seller.email },
    { label: 'Category', value: listing.category.name },
    { label: 'Price', value: formatListingPrice(listing.price, listing.currency) },
    { label: 'Phone', value: listing.phone },
    { label: 'YouTube', value: listing.youtube },
    { label: 'Facebook', value: listing.facebookUrl },
    { label: 'Messenger', value: listing.messengerUrl }
  ]

  return (
    <section aria-labelledby="listing-review-heading" className="flex min-w-0 flex-col gap-6">
      <Button nativeButton={false} variant="outline" className="self-start" render={<Link href="/moderator/listings" />}>
        <ArrowLeft aria-hidden="true" /> Back to queue
      </Button>
      <div className="flex flex-col items-start gap-3">
        <h2 id="listing-review-heading" className="text-2xl font-semibold wrap-anywhere">
          {listing.title}
        </h2>
        <ListingStatusBadge status={listing.status} />
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ListingGallery key={listing.id} title={listing.title} images={listing.images} />
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>
                <h3>Description</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>
                <h3>Review decision</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {listing.status === 'PENDING' ? (
                <ListingModerationControls key={listing.updatedAt} id={listing.id} updatedAt={listing.updatedAt} />
              ) : (
                <p role="status" className="text-muted-foreground text-sm">
                  This listing is no longer pending. There is no moderation decision to make.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>
                <h3>Listing details</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex min-w-0 flex-col gap-4 text-sm">
                {details
                  .filter(({ value }) => value)
                  .map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="wrap-anywhere">{value}</dd>
                    </div>
                  ))}
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>
                    <time dateTime={listing.createdAt.toISOString()}>{dayjs.utc(listing.createdAt).format('D MMM YYYY, HH:mm [UTC]')}</time>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Content updated</dt>
                  <dd>
                    <time dateTime={listing.updatedAt}>{dayjs.utc(listing.updatedAt).format('D MMM YYYY, HH:mm [UTC]')}</time>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
