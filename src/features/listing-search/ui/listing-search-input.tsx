'use client'

import { Loader2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LISTING_QUERY_MAX_LENGTH } from '@/entities/listing/constants'
import { cn } from '@/lib/utils'

type ListingSearchInputProps = {
  query: string
  isPending: boolean
  placeholder: string
  hero: boolean
  onQueryChange: (value: string) => void
}

export function ListingSearchInput({ query, isPending, placeholder, hero, onQueryChange }: ListingSearchInputProps) {
  return (
    <div className={cn('relative', hero && 'min-w-0 flex-1')}>
      <Search aria-hidden="true" className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        name="q"
        aria-label="Search listings"
        value={query}
        maxLength={LISTING_QUERY_MAX_LENGTH}
        placeholder={placeholder}
        className={cn('px-9 py-5', hero && 'h-12 border-0 bg-transparent shadow-none')}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {isPending ? (
        <span role="status" aria-label="Searching listings" className="absolute top-1/2 right-3 -translate-y-1/2">
          <Loader2 aria-hidden="true" className="text-muted-foreground size-4 motion-safe:animate-spin" />
        </span>
      ) : (
        query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 -translate-y-1/2 rounded-sm focus-visible:ring-2"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )
      )}
    </div>
  )
}
