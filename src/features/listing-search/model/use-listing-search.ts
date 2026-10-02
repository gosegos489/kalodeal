'use client'

import { debounce, defaultRateLimit, parseAsString, useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'

const searchParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault('')
}

type FilterUpdates = { q?: string | null; category?: string | null }

export function useListingSearch() {
  const [isPending, startTransition] = useTransition()
  const [{ q: query, category }, setFilters] = useQueryStates(searchParsers, {
    shallow: false,
    scroll: false,
    startTransition
  })

  async function updateFilters(values: FilterUpdates, limitUrlUpdates = defaultRateLimit) {
    try {
      await setFilters(values, { limitUrlUpdates })
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
    return updateFilters({ q: value || null }, value ? debounce(300) : defaultRateLimit)
  }

  function setCategory(value: string | null) {
    return updateFilters({ category: value || null })
  }

  function submitSearch() {
    return updateFilters({ q: query.trim() || null, category: category || null })
  }

  return { isPending, query, category, setSearch, setCategory, submitSearch }
}
