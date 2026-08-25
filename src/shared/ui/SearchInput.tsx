'use client'

import { Loader2, Search, X } from 'lucide-react'
import { debounce, parseAsString, useQueryState } from 'nuqs'
import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  placeholder?: string
  className?: string
}

export function SearchInput({ placeholder = 'Search...', className }: Props) {
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      startTransition
    })
  )

  const [, setPage] = useQueryState('page')

  const handleSearch = (value: string) => {
    setPage(null)

    setSearch(value || null, {
      limitUrlUpdates: value ? debounce(300) : undefined
    })
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

      <Input
        type="search"
        value={search}
        maxLength={32}
        placeholder={placeholder}
        className="px-9 py-5"
        onChange={(e) => handleSearch(e.target.value)}
      />

      {isPending ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
      ) : (
        search && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="size-4" />
          </button>
        )
      )}
    </div>
  )
}
