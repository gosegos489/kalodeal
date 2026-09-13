'use client'

import { Loader2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useListingSearch } from '../model/use-listing-search'

type Props = {
  placeholder?: string
  className?: string
}

export function ListingSearch({ placeholder = 'Search listings...', className }: Props) {
  const { isPending, query, setSearch } = useListingSearch()

  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

      <Input
        type="search"
        value={query}
        maxLength={100}
        placeholder={placeholder}
        className="px-9 py-5"
        onChange={(event) => setSearch(event.target.value)}
      />

      {isPending ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
      ) : (
        query && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="size-4" />
          </button>
        )
      )}
    </div>
  )
}
