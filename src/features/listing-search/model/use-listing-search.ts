'use client'

import { debounce, defaultRateLimit, parseAsString, useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { getDistrict, isAreaInDistrict } from '@/entities/location/catalog'

const searchParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  district: parseAsString.withDefault(''),
  area: parseAsString.withDefault('')
}

type FilterUpdates = { q?: string | null; category?: string | null; district?: string | null; area?: string | null }

export function useListingSearch() {
  const [isPending, startTransition] = useTransition()
  const [{ q: query, category, district: rawDistrict, area: rawArea }, setFilters] = useQueryStates(searchParsers, {
    shallow: false,
    scroll: false,
    startTransition
  })

  const district = getDistrict(rawDistrict)?.slug ?? ''
  const area = isAreaInDistrict(district, rawArea) ? rawArea : ''

  async function updateFilters(values: FilterUpdates, limitUrlUpdates = defaultRateLimit, history: 'push' | 'replace' = 'push') {
    try {
      await setFilters(values, { limitUrlUpdates, history })
      return true
    } catch {
      toast.add({
        type: 'error',
        title: 'Unable to update search',
        description: 'Please try again.'
      })
      return false
    }
  }

  function setSearch(value: string) {
    return updateFilters({ q: value || null }, value ? debounce(300) : defaultRateLimit, 'replace')
  }

  function setCategory(value: string | null) {
    return updateFilters({ category: value || null })
  }

  function submitSearch() {
    return updateFilters({ q: query.trim() || null, category: category || null, district: district || null, area: area || null })
  }

  function setDistrict(value: string) {
    const nextDistrict = getDistrict(value)?.slug ?? ''
    return updateFilters({ district: nextDistrict || null, area: isAreaInDistrict(nextDistrict, rawArea) ? rawArea : null })
  }

  function setArea(value: string) {
    return updateFilters({ district: district || null, area: isAreaInDistrict(district, value) ? value : null })
  }

  function clearLocation() {
    return updateFilters({ district: null, area: null })
  }

  return {
    isPending,
    query,
    category,
    district,
    area,
    hasLocationFilters: !!(rawDistrict || rawArea),
    setSearch,
    setCategory,
    setDistrict,
    setArea,
    clearLocation,
    submitSearch
  }
}
