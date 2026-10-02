import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { dayjs } from '@/lib/dayjs'
import type { ListingSummary } from '../types'

type ListingCardProps = {
  listing: Pick<ListingSummary, 'title' | 'description' | 'category' | 'price' | 'coverUrl' | 'createdAt'>
  eager?: boolean
}

export function ListingCard({ listing, eager = false }: ListingCardProps) {
  return (
    <article className="bg-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs">
      <div className="bg-muted relative aspect-4/3 overflow-hidden">
        {listing.coverUrl ? (
          <Image
            src={listing.coverUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
            loading={eager ? 'eager' : 'lazy'}
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
            <ImageIcon aria-hidden="true" className="size-8" strokeWidth={1.5} />
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <p className="text-muted-foreground truncate text-xs">{listing.category.name}</p>
        <h3 className="line-clamp-2 leading-snug font-semibold">{listing.title}</h3>
        <p className="text-primary text-lg font-semibold">{listing.price === null ? 'Price on request' : `$${listing.price}`}</p>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{listing.description}</p>
        <time dateTime={listing.createdAt.toISOString()} className="text-muted-foreground mt-auto border-t pt-3 text-xs">
          {dayjs.utc(listing.createdAt).format('D MMM YYYY')}
        </time>
      </div>
    </article>
  )
}
