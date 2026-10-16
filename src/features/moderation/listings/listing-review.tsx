import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getListingChatLabel } from '@/entities/listing/contact-links'
import { ListingAttributeDetails } from '@/entities/listing/ui/listing-attributes'
import { ListingGallery } from '@/entities/listing/ui/listing-gallery'
import { ListingRow } from '@/entities/listing/ui/listing-row'
import { formatLocation } from '@/entities/location/catalog'
import { ListingModerationFeedback } from '@/features/account/listing-moderation-feedback'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { getListingCategoryOptions } from '@/features/create-listing/get-category-options'
import { formatAttributeListingPrice } from '@/features/listing-attributes/format-price'
import { dayjs } from '@/lib/dayjs'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import { getModerationListing } from './data'
import { ListingModerationWorkspace } from './listing-moderation-workspace'

export async function ListingReview({ id }: { id: string }) {
  const listing = await getModerationListing(id)
  if (!listing) {
    return (
      <section aria-labelledby="listing-review-heading" className="flex flex-col gap-4">
        <h2 id="listing-review-heading" className="text-2xl font-semibold">
          Listing no longer available
        </h2>
        <p role="status" className="text-muted-foreground text-sm">
          This listing may have been deleted. Return to the queue to review another listing.
        </p>
        <Button nativeButton={false} variant="outline" className="self-start" render={<Link href="/moderator/listings" />}>
          <ArrowLeft aria-hidden="true" /> Back to queue
        </Button>
      </section>
    )
  }
  const availableCategories = await getListingCategoryOptions()
  const categories = availableCategories.some(({ id }) => id === listing.category.id)
    ? availableCategories
    : [...availableCategories, { ...listing.category, parentId: null }]
  const details = [
    { label: 'Seller', value: listing.seller.name },
    { label: 'Seller email', value: listing.seller.email },
    { label: 'Category', value: listing.category.name },
    { label: 'Location', value: formatLocation(listing) ?? 'Not specified' },
    { label: 'Price', value: formatAttributeListingPrice(listing.price, listing.currency, listing.category.slug, listing.attributes) },
    { label: 'Phone', value: listing.phone },
    { label: 'YouTube', value: listing.youtube },
    { label: 'Facebook', value: listing.facebookUrl },
    { label: listing.messengerUrl ? getListingChatLabel(listing.messengerUrl) : 'WhatsApp', value: listing.messengerUrl }
  ]

  return (
    <section aria-labelledby="listing-review-heading" className="flex min-w-0 flex-col gap-6">
      <RouteAutoRefresh />
      <Button nativeButton={false} variant="outline" className="self-start" render={<Link href="/moderator/listings" />}>
        <ArrowLeft aria-hidden="true" /> Back to queue
      </Button>
      <div className="flex flex-col items-start gap-3">
        <h2 id="listing-review-heading" className="text-2xl font-semibold wrap-anywhere">
          {listing.title}
        </h2>
        <ListingStatusBadge status={listing.status} />
        <ListingModerationFeedback
          status={listing.status}
          moderationReason={listing.moderationReason}
          moderationMessage={listing.moderationMessage}
        />
      </div>
      <div className="bg-muted/50 space-y-2 rounded-xl border p-4 text-sm leading-relaxed">
        <p className="font-medium">Duplicate listings are not allowed.</p>
        <p>
          Compare the item, photos, location and other listings from this seller before deciding. Matching titles alone do not prove duplication. For
          a confirmed duplicate, use Reject with the Duplicate listing reason and explain the match to the owner.
        </p>
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ListingGallery key={`${listing.id}:${listing.updatedAt}`} title={listing.title} images={listing.images} />
          <ListingAttributeDetails categorySlug={listing.category.slug} attributes={listing.attributes} staff />
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
      {listing.otherListings.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h3>Other recent listings from this seller</h3>
            </CardTitle>
            <p className="text-muted-foreground text-sm">Up to six recent listings for manual comparison. These are not confirmed duplicates.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {listing.otherListings.map((other) => (
              <ListingRow
                key={other.id}
                listing={other}
                href={`/moderator/listings/${other.id}`}
                metadata={<span>{other.category.name}</span>}
                status={<ListingStatusBadge status={other.status} />}
                actions={
                  <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/moderator/listings/${other.id}`} />}>
                    Compare listing
                  </Button>
                }
              />
            ))}
          </CardContent>
        </Card>
      )}
      <ListingModerationWorkspace key={listing.id} listing={listing.correction} categories={categories} />
    </section>
  )
}
