import { ImageIcon, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { listingStatusLabels } from '@/entities/listing/lifecycle'
import { formatLocation } from '@/entities/location/catalog'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatAttributeListingPrice } from '@/features/listing-attributes/format-price'
import type { ListingStatus } from '@/generated/prisma/enums'
import { dayjs } from '@/lib/dayjs'
import type { ListingSummary } from '../types'
import { ListingCardImages } from './listing-card-images'

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
  const location = formatLocation(listing)

  return (
    <article className="bg-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs">
      <div className="relative">
        {listing.imageUrls.length > 1 ? (
          <ListingCardImages
            key={listing.id}
            images={listing.imageUrls}
            title={listing.title}
            href={href}
            sizes={imageSizes}
            eager={eager}
            prefetch={prefetch}
          />
        ) : (
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
        )}
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
          <p className="text-primary text-lg font-semibold">
            {formatAttributeListingPrice(listing.price, listing.currency, listing.category.slug ?? '', {
              pricePeriod: listing.pricePeriod ?? null,
              priceNegotiable: listing.priceNegotiable ?? false
            })}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{listing.description}</p>
        </Link>
        {location && (
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {location}
          </p>
        )}
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
