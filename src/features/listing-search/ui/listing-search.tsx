'use client'

import { Button } from '@/components/ui/button'
import { AreaSelect, DistrictSelect } from '@/entities/location/ui/location-selects'
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
  const {
    isPending,
    query,
    category,
    district,
    area,
    hasLocationFilters,
    setSearch,
    setCategory,
    setDistrict,
    setArea,
    clearLocation,
    submitSearch
  } = useListingSearch()
  const hero = variant === 'hero'

  async function handleSearch() {
    await submitSearch()
  }

  return (
    <form
      role="search"
      aria-label={hero ? 'Find listings' : 'Quick listing search'}
      aria-busy={isPending}
      className={cn(hero && 'bg-card flex flex-col gap-3 rounded-2xl border p-3 shadow-sm', className)}
      action={handleSearch}
    >
      <div className={cn(hero && 'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center')}>
        <ListingSearchInput query={query} isPending={isPending} placeholder={placeholder} hero={hero} onQueryChange={setSearch} />
        {hero && categories.length > 0 && <ListingSearchSelect categories={categories} value={category} onValueChange={setCategory} />}
        {hero && <ListingSearchButton isPending={isPending} />}
      </div>
      {hero && (
        <div className="grid min-w-0 items-center gap-3 border-t pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <DistrictSelect value={district} onValueChange={setDistrict} allowAll className="w-full min-w-0 data-[size=default]:h-12" />
          <AreaSelect key={district} district={district} value={area} onValueChange={setArea} allowAll className="h-12" />
          {hasLocationFilters && (
            <Button type="button" variant="ghost" onClick={() => void clearLocation()}>
              Clear location
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
