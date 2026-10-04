import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatListingPrice } from '@/entities/listing/format-price'
import { listingStatusLabels } from '@/entities/listing/lifecycle'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import type { ListingStatus } from '@/generated/prisma/enums'
import { dayjs } from '@/lib/dayjs'
import type { ListingSummary } from '../types'

type ListingCardProps = {
  listing: ListingSummary
  eager?: boolean
  prefetch?: false
  status?: ListingStatus
  imageSizes?: string
  isFavorited: boolean
  isAuthenticated: boolean
  showFavorite?: boolean
}

export function ListingCard({
  listing,
  eager = false,
  prefetch,
  status,
  isFavorited,
  isAuthenticated,
  showFavorite = true,
  imageSizes = '(max-width: 639px) calc(100vw - 32px), (max-width: 767px) calc((100vw - 48px) / 2), (max-width: 1279px) calc((100vw - 64px) / 3), calc((100vw - 80px) / 4)'
}: ListingCardProps) {
  const href = `/listings/${listing.id}`

  return (
    <article className="bg-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs">
      <div className="relative">
        <Link
          href={href}
          prefetch={prefetch}
          aria-label={`View listing: ${listing.title}`}
          className="bg-muted focus-visible:ring-ring relative block aspect-4/3 shrink-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"
        >
          {listing.coverUrl ? (
            <Image src={listing.coverUrl} alt={listing.title} fill sizes={imageSizes} loading={eager ? 'eager' : 'lazy'} className="object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <ImageIcon aria-hidden="true" className="size-8" strokeWidth={1.5} />
              <span className="text-xs">No photo</span>
            </div>
          )}
        </Link>
        {showFavorite && (
          <FavoriteButton
            listingId={listing.id}
            title={listing.title}
            isFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
            className="absolute top-3 right-3"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground truncate text-xs">{listing.category.name}</p>
          {status && (
            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize">
              {listingStatusLabels[status]}
            </Badge>
          )}
        </div>
        <Link
          href={href}
          prefetch={prefetch}
          className="group focus-visible:ring-ring flex flex-col gap-2 rounded-sm outline-none focus-visible:ring-2"
        >
          <h3 className="group-hover:text-primary line-clamp-2 leading-snug font-semibold">{listing.title}</h3>
          <p className="text-primary text-lg font-semibold">{formatListingPrice(listing.price, listing.currency)}</p>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{listing.description}</p>
        </Link>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
          <time dateTime={listing.createdAt.toISOString()} className="text-muted-foreground">
            {dayjs.utc(listing.createdAt).format('D MMM YYYY')}
          </time>
          <Link
            href={href}
            prefetch={prefetch}
            aria-label={`View listing: ${listing.title}`}
            className="text-primary focus-visible:ring-ring rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2"
          >
            View listing
          </Link>
        </div>
      </div>
    </article>
  )
}
