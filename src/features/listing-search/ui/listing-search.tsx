'use client'

import { cn } from '@/lib/utils'
import { useListingSearch } from '../model/use-listing-search'
import { ListingSearchButton } from './listing-search-button'
import { ListingSearchInput } from './listing-search-input'
import { ListingSearchSelect, type SearchCategory } from './listing-search-select'

type ListingSearchProps = {
  placeholder?: string
  className?: string
  variant?: 'default' | 'hero'
  categories?: SearchCategory[]
}

export function ListingSearch({ placeholder = 'Search listings...', className, variant = 'default', categories = [] }: ListingSearchProps) {
  const { isPending, query, category, setSearch, setCategory, submitSearch } = useListingSearch()
  const hero = variant === 'hero'

  async function handleSearch() {
    await submitSearch()
  }

  return (
    <form
      role="search"
      aria-label={hero ? 'Find listings' : 'Quick listing search'}
      aria-busy={isPending}
      className={cn(hero && 'bg-card flex flex-col gap-3 rounded-2xl border p-3 shadow-sm sm:flex-row sm:items-center', className)}
      action={handleSearch}
    >
      <ListingSearchInput query={query} isPending={isPending} placeholder={placeholder} hero={hero} onQueryChange={setSearch} />
      {hero && categories.length > 0 && <ListingSearchSelect categories={categories} value={category} onValueChange={setCategory} />}
      {hero && <ListingSearchButton isPending={isPending} />}
    </form>
  )
}
