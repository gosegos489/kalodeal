'use client'

import { debounce, parseAsString, useQueryState } from 'nuqs'
import { useTransition } from 'react'

export function useListingSearch() {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      startTransition
    })
  )

  function setSearch(value: string) {
    return setQuery(value || null, {
      limitUrlUpdates: value ? debounce(300) : undefined
    })
  }

  return { isPending, query, setSearch }
}
