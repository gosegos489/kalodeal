import { Eye, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ListingSummary } from '@/entities/listing/types'
import type { ListingStatus } from '@/generated/prisma/enums'
import { dayjs } from '@/lib/dayjs'
import { DeleteListingButton } from './delete-listing-button'
import { ListingStatusBadge } from './listing-status-badge'

type MyListingRowProps = { listing: ListingSummary & { status: ListingStatus } }

export function MyListingRow({ listing }: MyListingRowProps) {
  const href = `/listings/${listing.id}`

  return (
    <article className="bg-card hover:border-primary/25 focus-within:border-primary/40 grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-xl border p-3 transition-colors sm:p-4 xl:grid-cols-[64px_minmax(0,1fr)_auto_auto] xl:gap-4">
      <Link
        href={href}
        aria-label={`View listing: ${listing.title}`}
        className="bg-muted focus-visible:ring-ring relative size-16 overflow-hidden rounded-lg outline-none focus-visible:ring-2"
      >
        {listing.coverUrl ? (
          <Image src={listing.coverUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="text-muted-foreground flex h-full items-center justify-center">
            <ImageIcon aria-hidden="true" className="size-5" />
          </span>
        )}
      </Link>
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm font-semibold">
          <Link
            href={href}
            className="hover:text-primary focus-visible:ring-ring line-clamp-2 rounded-sm wrap-anywhere outline-none focus-visible:ring-2"
          >
            {listing.title}
          </Link>
        </h3>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs wrap-anywhere">
          <span className="text-foreground font-medium">{listing.price === null ? 'Price on request' : `$${listing.price}`}</span>
          <span className="max-w-full truncate" title={listing.category.name}>
            {listing.category.name}
          </span>
          <time dateTime={listing.createdAt.toISOString()}>{dayjs.utc(listing.createdAt).format('D MMM YYYY')}</time>
        </div>
      </div>
      <div className="col-span-2 xl:col-span-1">
        <ListingStatusBadge status={listing.status} />
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 border-t pt-3 xl:col-span-1 xl:justify-end xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4">
        <Button nativeButton={false} variant="outline" size="sm" aria-label={`View listing: ${listing.title}`} render={<Link href={href} />}>
          <Eye aria-hidden="true" /> View
        </Button>
        <DeleteListingButton listingId={listing.id} title={listing.title} />
      </div>
    </article>
  )
}
