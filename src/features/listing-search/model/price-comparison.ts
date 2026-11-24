import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import type { SearchFilters } from './query-state'

const periods = ['ONE_OFF', 'DAY', 'WEEK', 'MONTH', 'YEAR'] as const

export function getPriceComparisonPeriod(category: string, current = '') {
  const profile = getCategoryAttributeProfile(category)
  const rental = profile.kind === 'property' && profile.transaction === 'rent'
  const allowed = rental ? profile.pricePeriods : profile.kind === 'generic' ? periods : (['ONE_OFF'] as const)
  // Keep compatible bookmarked URLs. New rentals use monthly prices, or the
  // first supported period for categories such as short-term accommodation.
  return allowed.find((period) => period === current) ?? (rental ? (allowed.find((period) => period === 'MONTH') ?? allowed[0]) : 'ONE_OFF')
}

export function withPriceComparisonDefaults(filters: SearchFilters): SearchFilters {
  const comparesPrices = filters.minPrice || filters.maxPrice || filters.sort === 'PRICE_LOW' || filters.sort === 'PRICE_HIGH'
  if (!comparesPrices) return filters
  return { ...filters, currency: filters.currency || 'EUR', pricePeriod: getPriceComparisonPeriod(filters.category, filters.pricePeriod) ?? '' }
}
