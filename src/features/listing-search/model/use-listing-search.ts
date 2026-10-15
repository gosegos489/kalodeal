'use client'

import { debounce, defaultRateLimit, parseAsString, useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { getDistrict, isAreaInDistrict } from '@/entities/location/catalog'
import { type FilterUpdates, type SearchFilters, getFilterUpdate } from './filter-updates'

const searchParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  district: parseAsString.withDefault(''),
  area: parseAsString.withDefault('')
}

export function useListingSearch() {
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(searchParsers, { shallow: false, scroll: false, startTransition })
  const { q: query, category, district: rawDistrict, area: rawArea } = filters
  const district = getDistrict(rawDistrict)?.slug ?? ''
  const area = isAreaInDistrict(district, rawArea) ? rawArea : ''

  async function updateFilters(values: FilterUpdates, limitUrlUpdates = defaultRateLimit, history: 'push' | 'replace' = 'push') {
    try {
      await setFilters(getFilterUpdate(filters, values), { limitUrlUpdates, history })
      return true
    } catch {
      toast.add({ type: 'error', title: 'Unable to update search', description: 'Please try again.' })
      return false
    }
  }

  return {
    isPending,
    query,
    category,
    district,
    area,
    rawDistrict,
    rawArea,
    hasFilters: Object.values(filters).some((value) => value.trim().length > 0),
    invalidLocation: Boolean((rawDistrict && !district) || (rawArea && !area)),
    setSearch: (value: string) => updateFilters({ q: value || null }, value ? debounce(300) : defaultRateLimit, 'replace'),
    setCategory: (value: string | null) => updateFilters({ category: value || null }),
    setDistrict: (value: string) => updateFilters({ district: value || null }),
    setArea: (value: string) => updateFilters({ area: value || null }),
    removeFilter: (key: keyof SearchFilters) => updateFilters({ [key]: null }),
    clearFilters: () => updateFilters({ q: null, category: null, district: null, area: null }),
    submitSearch: () => updateFilters({ q: query.trim() || null })
  }
}
