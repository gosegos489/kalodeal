'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CYPRUS_LOCATIONS, getDistrict } from '@/entities/location/catalog'
import { propertyTypeLabels } from '@/features/listing-attributes/labels'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { getVehicleMakes, getVehicleModels } from '@/features/listing-attributes/vehicle-catalog'
import { FILTER_LABELS, type SearchKey, applicableSearchParams, filterLabel } from '../model/search-params'
import { useListingSearch } from '../model/use-listing-search'
import type { SearchCategory } from './listing-search-select'

export function ActiveFilters({ categories }: { categories: SearchCategory[] }) {
  const search = useListingSearch()
  const profile = getCategoryAttributeProfile(search.category)
  const applicable = applicableSearchParams(search.filters, profile)
  const chips = Object.entries(search.filters)
    .filter(([key, value]) => key !== 'page' && value && applicable[key])
    .flatMap(([key, value]) => (key === 'amenities' ? value.split(',') : [value]).map((value) => ({ key: key as SearchKey, value })))
  function label(key: string, value: string) {
    if (key === 'q') return value
    if (key === 'category') return categories.find((category) => category.slug === value)?.name ?? value
    if (key === 'district') return getDistrict(value)?.name ?? value
    if (key === 'area') return CYPRUS_LOCATIONS.map(({ areas }) => areas.find(([slug]) => slug === value)?.[1]).find(Boolean) ?? value
    if (key === 'propertyType' && profile.kind === 'property') {
      const type = profile.propertyTypes.find((type) => type === value)
      if (type) return propertyTypeLabels[type]
    }
    if (profile.kind === 'vehicle' && key === 'make') return getVehicleMakes(profile.vehicleType).find((make) => make.key === value)?.label ?? value
    if (profile.kind === 'vehicle' && key === 'model')
      return getVehicleModels(search.filters.make, profile.vehicleType).find((model) => model.key === value)?.label ?? value
    return value.split(',').map(filterLabel).join(', ')
  }
  if (!search.hasFilters) return null
  return (
    <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2" aria-label="Active filters" aria-busy={search.isPending}>
      {chips.map(({ key, value }) => {
        return (
          <Button
            key={`${key}-${value}`}
            type="button"
            variant="outline"
            disabled={search.isPending}
            className="h-auto min-h-9 max-w-full gap-2 rounded-full py-2 text-xs"
            aria-label={`Remove ${FILTER_LABELS[key]} filter: ${label(key, value)}`}
            onClick={() =>
              void (key === 'amenities'
                ? search.setFilter(
                    key,
                    search.filters.amenities
                      .split(',')
                      .filter((item) => item !== value)
                      .join(',')
                  )
                : search.removeFilter(key))
            }
          >
            <span className="min-w-0 truncate">
              {FILTER_LABELS[key]}: {label(key, value)}
            </span>
            <X aria-hidden="true" className="size-3.5 shrink-0" />
          </Button>
        )
      })}
      <Button type="button" variant="ghost" className="min-h-9 text-xs" disabled={search.isPending} onClick={() => void search.clearFilters()}>
        Clear all filters
      </Button>
    </div>
  )
}
