import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatListingPrice } from '../format-price'
import type { ListingSummary } from '../types'

type ListingRowProps = {
  listing: Pick<ListingSummary, 'id' | 'title' | 'price' | 'currency' | 'coverUrl'>
  href: string | null
  metadata: ReactNode
  status: ReactNode
  actions: ReactNode
}

export function ListingRow({ listing, href, metadata, status, actions }: ListingRowProps) {
  const thumbnailClassName =
    'bg-muted focus-visible:ring-ring relative row-span-2 size-16 overflow-hidden rounded-lg outline-none focus-visible:ring-2 xl:row-span-1'
  const thumbnail = listing.coverUrl ? (
    <Image src={listing.coverUrl} alt="" fill sizes="64px" className="object-cover" />
  ) : (
    <span className="text-muted-foreground flex h-full items-center justify-center">
      <ImageIcon aria-hidden="true" className="size-5" />
    </span>
  )

  return (
    <article className="bg-card hover:border-primary/25 focus-within:border-primary/40 grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border p-3 transition-colors sm:p-4 xl:grid-cols-[64px_minmax(0,1fr)_auto_auto] xl:gap-4">
      {href ? (
        <Link href={href} aria-label={`View listing: ${listing.title}`} className={thumbnailClassName}>
          {thumbnail}
        </Link>
      ) : (
        <div className={thumbnailClassName}>{thumbnail}</div>
      )}
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm font-semibold">
          {href ? (
            <Link
              href={href}
              className="hover:text-primary focus-visible:ring-ring line-clamp-2 rounded-sm wrap-anywhere outline-none focus-visible:ring-2"
            >
              {listing.title}
            </Link>
          ) : (
            <span className="line-clamp-2 wrap-anywhere">{listing.title}</span>
          )}
        </h3>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs wrap-anywhere">
          <span className="text-foreground font-medium">{formatListingPrice(listing.price, listing.currency)}</span>
          {metadata}
        </div>
      </div>
      <div className="col-start-2 xl:col-start-auto">{status}</div>
      <div className="col-span-2 min-w-0 border-t pt-3 xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4">{actions}</div>
    </article>
  )
}
