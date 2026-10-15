'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CYPRUS_LOCATIONS, getDistrict } from '@/entities/location/catalog'
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
  const search = useListingSearch()
  const hero = variant === 'hero'
  const chips = [
    { key: 'q', label: search.query.trim(), kind: 'Search' },
    { key: 'category', label: categories.find(({ slug }) => slug === search.category)?.name ?? search.category.trim(), kind: 'Category' },
    { key: 'district', label: getDistrict(search.rawDistrict)?.name ?? search.rawDistrict.trim(), kind: 'District' },
    {
      key: 'area',
      label: CYPRUS_LOCATIONS.map(({ areas }) => areas.find(([slug]) => slug === search.rawArea)?.[1]).find(Boolean) ?? search.rawArea.trim(),
      kind: 'Area'
    }
  ] as const

  return (
    <form
      role="search"
      aria-label={hero ? 'Find listings' : 'Quick listing search'}
      aria-busy={search.isPending}
      className={cn('min-w-0 space-y-4', className)}
      onSubmit={(event) => {
        event.preventDefault()
        void search.submitSearch()
      }}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <ListingSearchInput
          query={search.query}
          isPending={search.isPending}
          placeholder={placeholder}
          hero={hero}
          onQueryChange={search.setSearch}
        />
        <ListingSearchButton isPending={search.isPending} />
      </div>
      {hero && (
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Category</p>
            <ListingSearchSelect categories={categories} value={search.category} onValueChange={search.setCategory} />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">District</p>
            <DistrictSelect value={search.district} onValueChange={search.setDistrict} allowAll className="w-full min-w-0 data-[size=default]:h-12" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">Area</p>
            <AreaSelect
              key={search.district}
              district={search.district}
              value={search.area}
              onValueChange={search.setArea}
              allowAll
              className="h-12"
            />
          </div>
        </div>
      )}
      {search.invalidLocation && (
        <p role="status" className="text-destructive text-sm">
          This location combination is invalid. Choose a district and an area within it, or clear the filters.
        </p>
      )}
      {search.hasFilters && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 border-t pt-4" aria-label="Active filters">
          <span className="text-muted-foreground mr-1 text-xs font-medium">Active filters</span>
          {chips
            .filter(({ label }) => label.length > 0)
            .map(({ key, label, kind }) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-auto min-h-10 max-w-full gap-2 rounded-full py-2 text-xs"
                aria-label={`Remove ${kind.toLowerCase()} filter: ${label}`}
                onClick={() => void search.removeFilter(key)}
              >
                <span className="min-w-0 truncate">
                  {kind}: {label}
                </span>
                <X aria-hidden="true" className="size-3.5 shrink-0" />
              </Button>
            ))}
          <Button type="button" variant="ghost" className="min-h-10 text-xs sm:ml-auto" onClick={() => void search.clearFilters()}>
            Clear all filters
          </Button>
        </div>
      )}
    </form>
  )
}
