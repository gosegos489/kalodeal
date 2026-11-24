import { ImageIcon, MapPin } from 'lucide-react'
import { getFormatter, getLocale, getMessages, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatAttributeListingPrice } from '@/features/listing-attributes/format-price'
import type { ListingStatus } from '@/generated/prisma/enums'
import { categoryName } from '@/i18n/category-name'
import { getFavoriteLabels } from '@/i18n/listing-labels'
import { localizedLocation } from '@/i18n/location-name'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
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

export async function ListingCard({
  listing,
  eager = false,
  prefetch,
  status,
  isFavorited,
  isAuthenticated,
  showFavorite = true,
  imageSizes = '(max-width: 639px) calc(100vw - 32px), (max-width: 767px) calc((100vw - 48px) / 2), (max-width: 1279px) calc((100vw - 64px) / 3), calc((100vw - 80px) / 4)'
}: ListingCardProps) {
  const locale = await getLocale()
  const format = await getFormatter({ locale })
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Listing' })
  const favoriteLabels = await getFavoriteLabels()
  const href = localizeHref(`/listings/${listing.id}`, locale)
  const location = localizedLocation(listing, messages.Locations)

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
            labels={{
              view: t('viewLabel', { title: listing.title }),
              photos: t('photos', { title: listing.title }),
              alts: listing.imageUrls.map((_, index) => t('photoAlt', { title: listing.title, number: index + 1 })),
              show: listing.imageUrls.map((_, index) => t('showPhoto', { number: index + 1 })),
              status: listing.imageUrls.map((_, index) => t('photoCount', { number: index + 1, count: listing.imageUrls.length })),
              unavailable: t('photoUnavailable')
            }}
          />
        ) : (
          <Link
            href={href}
            prefetch={prefetch}
            aria-label={t('viewLabel', { title: listing.title })}
            className="bg-muted focus-visible:ring-ring relative block aspect-4/3 shrink-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"
          >
            {listing.coverUrl ? (
              <Image src={listing.coverUrl} alt={listing.title} fill sizes={imageSizes} loading={eager ? 'eager' : 'lazy'} className="object-cover" />
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
                <ImageIcon aria-hidden="true" className="size-8" strokeWidth={1.5} />
                <span className="text-xs">{t('noPhoto')}</span>
              </div>
            )}
          </Link>
        )}
        {showFavorite && (
          <FavoriteButton
            loginHref={localizeHref('/login', locale)}
            labels={favoriteLabels}
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
          <p className="text-muted-foreground truncate text-xs">{categoryName(listing.category, messages.CategoryNames)}</p>
          {status && (
            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'} className="capitalize">
              {t(status)}
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
            {formatAttributeListingPrice(
              listing.price,
              listing.currency,
              listing.category.slug ?? '',
              {
                pricePeriod: listing.pricePeriod ?? null,
                priceNegotiable: listing.priceNegotiable ?? false
              },
              { locale, labels: messages.Listing }
            )}
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
            {format.dateTime(listing.createdAt, 'listingDate')}
          </time>
          <Link
            href={href}
            prefetch={prefetch}
            aria-label={t('viewLabel', { title: listing.title })}
            className="text-primary focus-visible:ring-ring rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2"
          >
            {t('view')}
          </Link>
        </div>
      </div>
    </article>
  )
}
