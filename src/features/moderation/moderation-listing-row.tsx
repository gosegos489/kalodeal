import { Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListingRow } from '@/entities/listing/ui/listing-row'
import { ListingStatusBadge } from '@/features/account/listing-status-badge'
import { dayjs } from '@/lib/dayjs'
import type { getListingModerationQueue } from './data'

type Props = { listing: Awaited<ReturnType<typeof getListingModerationQueue>>['listings'][number] }

export function ModerationListingRow({ listing }: Props) {
  const href = `/moderator/listings/${listing.id}`

  return (
    <ListingRow
      listing={listing}
      href={href}
      metadata={
        <>
          <span>Seller: {listing.seller.name}</span>
          <span>{listing.seller.email}</span>
          <span>{listing.category.name}</span>
          <span>
            Created <time dateTime={listing.createdAt.toISOString()}>{dayjs.utc(listing.createdAt).format('D MMM YYYY')}</time>
          </span>
        </>
      }
      status={<ListingStatusBadge status={listing.status} />}
      actions={
        <Button nativeButton={false} variant="outline" size="sm" aria-label={`Review listing: ${listing.title}`} render={<Link href={href} />}>
          <Eye aria-hidden="true" /> Review
        </Button>
      }
    />
  )
}
