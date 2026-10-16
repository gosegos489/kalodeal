import { parseAsString } from 'nuqs/server'

export const SEARCH_DEFAULTS = {
  q: '',
  category: '',
  district: '',
  area: '',
  sort: '',
  seller: '',
  currency: '',
  pricePeriod: '',
  minPrice: '',
  maxPrice: '',
  propertyType: '',
  minBedrooms: '',
  maxBedrooms: '',
  minBathrooms: '',
  maxBathrooms: '',
  minPropertyArea: '',
  maxPropertyArea: '',
  minPlotArea: '',
  maxPlotArea: '',
  minConstructionYear: '',
  maxConstructionYear: '',
  parking: '',
  furnishing: '',
  airConditioning: '',
  petsAllowed: '',
  amenities: '',
  energyRating: '',
  make: '',
  model: '',
  minYear: '',
  maxYear: '',
  minMileage: '',
  maxMileage: '',
  fuel: '',
  transmission: '',
  bodyType: '',
  minEngineCapacity: '',
  maxEngineCapacity: '',
  seats: '',
  condition: '',
  page: ''
}
export type SearchFilters = typeof SEARCH_DEFAULTS
export type SearchKey = keyof SearchFilters
export type FilterUpdates = Partial<Record<SearchKey, string | null>>
export type RawSearchParams = Record<string, string | string[] | undefined>
export const searchParsers = Object.fromEntries(Object.keys(SEARCH_DEFAULTS).map((key) => [key, parseAsString.withDefault('')])) as Record<
  SearchKey,
  ReturnType<typeof parseAsString.withDefault>
>
