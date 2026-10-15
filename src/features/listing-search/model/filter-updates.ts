import { getDistrict, isAreaInDistrict } from '@/entities/location/catalog'

export type SearchFilters = { q: string; category: string; district: string; area: string }
export type FilterUpdates = Partial<{ [Key in keyof SearchFilters]: string | null }>

// One URL update also repairs malformed incoming geography. No mounting effect,
// second navigation or parallel React state is needed.
export function getFilterUpdate(current: SearchFilters, updates: FilterUpdates) {
  const next = { ...current, ...updates }
  const district = getDistrict(next.district ?? '')?.slug ?? null
  const area = district && isAreaInDistrict(district, next.area ?? '') ? next.area : null
  return { ...updates, district, area }
}
