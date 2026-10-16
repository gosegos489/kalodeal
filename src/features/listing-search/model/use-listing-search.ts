'use client'

import { useTranslations } from 'next-intl'
import { debounce, defaultRateLimit, useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { getDistrict, isAreaInDistrict } from '@/entities/location/catalog'
import { getFilterUpdate } from './filter-updates'
import { type FilterUpdates, SEARCH_DEFAULTS, type SearchKey, searchParsers } from './search-params'

export function useListingSearch() {
  const t = useTranslations('Search')
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useQueryStates(searchParsers, { shallow: false, scroll: false, startTransition })
  const { q: query, category, district: rawDistrict, area: rawArea } = filters
  const district = getDistrict(rawDistrict)?.slug ?? ''
  const area = isAreaInDistrict(district, rawArea) ? rawArea : ''

  async function updateFilters(values: FilterUpdates, limitUrlUpdates = defaultRateLimit, history: 'push' | 'replace' = 'push', replaceAll = false) {
    try {
      await setFilters(replaceAll ? values : getFilterUpdate(filters, values), { limitUrlUpdates, history })
      return true
    } catch {
      toast.add({ type: 'error', title: t('updateError'), description: t('retry') })
      return false
    }
  }

  return {
    filters,
    isPending,
    query,
    category,
    district,
    area,
    rawDistrict,
    rawArea,
    hasFilters: Object.entries(filters).some(([key, value]) => key !== 'page' && value.trim().length > 0),
    invalidLocation: Boolean((rawDistrict && !district) || (rawArea && !area)),
    setSearch: (value: string) => updateFilters({ q: value || null }, value ? debounce(300) : defaultRateLimit, 'replace'),
    setCategory: (value: string | null) => updateFilters({ category: value || null }),
    setDistrict: (value: string) => updateFilters({ district: value || null }),
    setArea: (value: string) => updateFilters({ area: value || null }),
    removeFilter: (key: SearchKey) => updateFilters({ [key]: null }),
    setFilter: (key: SearchKey, value: string) => updateFilters({ [key]: value || null }),
    clearFilters: () => updateFilters(Object.fromEntries(Object.keys(SEARCH_DEFAULTS).map((key) => [key, null])), defaultRateLimit, 'push', true),
    applyFilters: (values: typeof filters) => updateFilters({ ...values, page: '1' }, defaultRateLimit, 'push', true),
    submitSearch: () => updateFilters({ q: query.trim() || null })
  }
}
