'use client'

import { useMessages, useTranslations } from 'next-intl'
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
  const t = useTranslations('Search')
  const messages = useMessages()
  const labels = { ...messages.Locations, districts: messages.Locations }
  const search = useListingSearch()
  const hero = variant === 'hero'

  return (
    <form
      role="search"
      aria-label={t('searchListings')}
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
            <p className="text-sm font-medium">{t('fields.category')}</p>
            <ListingSearchSelect categories={categories} value={search.category} onValueChange={search.setCategory} />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">{t('fields.district')}</p>
            <DistrictSelect
              labels={labels}
              value={search.district}
              onValueChange={search.setDistrict}
              allowAll
              className="w-full min-w-0 data-[size=default]:h-12"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">{t('fields.area')}</p>
            <AreaSelect
              labels={labels}
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
          {t('invalidLocation')}
        </p>
      )}
    </form>
  )
}
