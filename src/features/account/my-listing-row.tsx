import { Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListingRow } from '@/entities/listing/ui/listing-row'
import { dayjs } from '@/lib/dayjs'
import { BumpListingButton } from './bump-listing-button'
import type { getMyListings } from './data'
import { DeleteListingButton } from './delete-listing-button'
import { ListingModerationFeedback } from './listing-moderation-feedback'
import { ListingOwnerActions } from './listing-owner-actions'
import { ListingStatusBadge } from './listing-status-badge'

type MyListingRowProps = { listing: Awaited<ReturnType<typeof getMyListings>>['listings'][number]; bumpsRemaining: number; canBump: boolean }

export function MyListingRow({ listing, bumpsRemaining, canBump }: MyListingRowProps) {
  const href = `/listings/${listing.id}`

  return (
    <ListingRow
      listing={listing}
      href={href}
      metadata={
        <>
          <span className="max-w-full truncate" title={listing.category.name}>
            {listing.category.name}
          </span>
          <time dateTime={listing.createdAt.toISOString()}>{dayjs.utc(listing.createdAt).format('D MMM YYYY')}</time>
          {listing.bumpedAt && (
            <span className="basis-full">
              Last bumped: <time dateTime={listing.bumpedAt.toISOString()}>{dayjs.utc(listing.bumpedAt).format('D MMM YYYY, HH:mm [UTC]')}</time>
            </span>
          )}
        </>
      }
      status={<ListingStatusBadge status={listing.status} />}
      feedback={
        ['CHANGES_REQUESTED', 'HIDDEN', 'REJECTED'].includes(listing.status) ? (
          <ListingModerationFeedback
            status={listing.status}
            moderationReason={listing.moderationReason}
            moderationMessage={listing.moderationMessage}
          />
        ) : null
      }
      actions={
        <div className="flex flex-col items-start gap-2 xl:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Button nativeButton={false} variant="outline" size="sm" aria-label={`View listing: ${listing.title}`} render={<Link href={href} />}>
              <Eye aria-hidden="true" /> View
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              aria-label={`Edit listing: ${listing.title}`}
              render={<Link href={`/account/listings/${listing.id}/edit`} />}
            >
              <Pencil aria-hidden="true" /> {listing.status === 'CHANGES_REQUESTED' || listing.status === 'HIDDEN' ? 'Edit listing' : 'Edit'}
            </Button>
            <DeleteListingButton listingId={listing.id} title={listing.title} />
          </div>
          <ListingOwnerActions key={listing.updatedAt} id={listing.id} title={listing.title} status={listing.status} updatedAt={listing.updatedAt} />
          <BumpListingButton listingId={listing.id} title={listing.title} status={listing.status} bumpsRemaining={bumpsRemaining} canBump={canBump} />
        </div>
      }
    />
  )
}
