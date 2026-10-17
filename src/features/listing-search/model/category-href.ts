import { createSerializer } from 'nuqs/server'
import { getFilterUpdate } from './filter-updates'
import { type SearchFilters, searchParsers } from './query-state'

const serialize = createSerializer(searchParsers)

// Use the same dependency cleanup for a real link and its enhanced nuqs click.
// Optimistic nuqs values also include text that has not reached the URL yet.
export function getCategorySearchHref(pathname: string, params: URLSearchParams, filters: SearchFilters, category: string) {
  const query = serialize(params, { ...filters, ...getFilterUpdate(filters, { category }) })
  return `${pathname}${query}#search-filters`
}
