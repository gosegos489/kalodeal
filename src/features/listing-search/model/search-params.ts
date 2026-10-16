import { parseAsString } from 'nuqs/server'
import { listingFiltersSchema } from '@/entities/listing/schema'
import { createListingAttributeFiltersSchema } from '@/features/listing-attributes/filters'
import { attributeLabel } from '@/features/listing-attributes/labels'
import { type CategoryAttributeProfile, getPropertyFields } from '@/features/listing-attributes/rules'
import { PropertyType } from '@/generated/prisma/enums'

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

export const PROPERTY_FILTER_KEYS = [
  'propertyType',
  'minBedrooms',
  'maxBedrooms',
  'minBathrooms',
  'maxBathrooms',
  'minPropertyArea',
  'maxPropertyArea',
  'minPlotArea',
  'maxPlotArea',
  'minConstructionYear',
  'maxConstructionYear',
  'parking',
  'furnishing',
  'airConditioning',
  'petsAllowed',
  'amenities',
  'energyRating'
] as const satisfies readonly SearchKey[]
export const VEHICLE_FILTER_KEYS = [
  'make',
  'model',
  'minYear',
  'maxYear',
  'minMileage',
  'maxMileage',
  'fuel',
  'transmission',
  'bodyType',
  'minEngineCapacity',
  'maxEngineCapacity',
  'seats',
  'condition'
] as const satisfies readonly SearchKey[]

export const FILTER_LABELS: Record<SearchKey, string> = {
  q: 'Search',
  category: 'Category',
  district: 'District',
  area: 'Area',
  sort: 'Sort',
  seller: 'Posted by',
  currency: 'Currency',
  pricePeriod: 'Price period',
  minPrice: 'Min price',
  maxPrice: 'Max price',
  propertyType: 'Property type',
  minBedrooms: 'Min bedrooms',
  maxBedrooms: 'Max bedrooms',
  minBathrooms: 'Min bathrooms',
  maxBathrooms: 'Max bathrooms',
  minPropertyArea: 'Min property area (m²)',
  maxPropertyArea: 'Max property area (m²)',
  minPlotArea: 'Min plot area (m²)',
  maxPlotArea: 'Max plot area (m²)',
  minConstructionYear: 'Construction year from',
  maxConstructionYear: 'Construction year to',
  parking: 'Parking',
  furnishing: 'Furnishing',
  airConditioning: 'Air conditioning',
  petsAllowed: 'Pets allowed',
  amenities: 'Amenities',
  energyRating: 'Energy efficiency',
  make: 'Make',
  model: 'Model',
  minYear: 'Year from',
  maxYear: 'Year to',
  minMileage: 'Mileage from (km)',
  maxMileage: 'Mileage to (km)',
  fuel: 'Fuel type',
  transmission: 'Transmission',
  bodyType: 'Body type',
  minEngineCapacity: 'Engine capacity from (cm³)',
  maxEngineCapacity: 'Engine capacity to (cm³)',
  seats: 'Seats',
  condition: 'Condition',
  page: 'Page'
}

export function filterLabel(value: string) {
  const special: Record<string, string> = {
    A_PLUS: 'A+',
    LPG: 'LPG',
    SUV: 'SUV',
    EUR: 'EUR',
    USD: 'USD',
    PERSONAL: 'Private sellers',
    BUSINESS: 'Businesses',
    ONE_OFF: 'One-off',
    RECENT: 'Newest',
    OLDEST: 'Oldest',
    PRICE_LOW: 'Price: Low to High',
    PRICE_HIGH: 'Price: High to Low',
    true: 'Yes',
    false: 'No'
  }
  return Object.hasOwn(special, value) ? special[value] : attributeLabel(value.charAt(0).toUpperCase() + value.slice(1))
}

// Ignore stale, incompatible detail parameters even in a hand-edited URL. The
// server supplies a profile resolved from its category record, never a client ID.
export function applicableSearchParams(raw: RawSearchParams, profile: CategoryAttributeProfile): RawSearchParams {
  const values = { ...raw }
  if (profile.kind !== 'property') for (const key of PROPERTY_FILTER_KEYS) delete values[key]
  if (profile.kind !== 'vehicle') for (const key of VEHICLE_FILTER_KEYS) delete values[key]
  if (profile.kind === 'property') {
    const type = Object.values(PropertyType).find((type) => type === values.propertyType)
    const types = type && profile.propertyTypes.includes(type) ? [type] : profile.propertyTypes
    for (const [field, keys] of [
      ['bedrooms', ['minBedrooms', 'maxBedrooms']],
      ['bathrooms', ['minBathrooms', 'maxBathrooms']],
      ['propertyArea', ['minPropertyArea', 'maxPropertyArea']],
      ['plotArea', ['minPlotArea', 'maxPlotArea']],
      ['constructionYear', ['minConstructionYear', 'maxConstructionYear']],
      ['parking', ['parking']],
      ['furnishing', ['furnishing']],
      ['airConditioning', ['airConditioning']],
      ['petsAllowed', ['petsAllowed']],
      ['energyRating', ['energyRating']]
    ] as const) {
      if (!types.some((type) => getPropertyFields(profile, type).includes(field))) for (const key of keys) delete values[key]
    }
  }
  if (profile.kind === 'vehicle' && profile.vehicleType === 'MOTORCYCLE') delete values.bodyType
  if (profile.kind === 'vehicle' && values.fuel === 'ELECTRIC') {
    delete values.minEngineCapacity
    delete values.maxEngineCapacity
  }
  return values
}

export function parseListingSearch(raw: RawSearchParams, profile: CategoryAttributeProfile) {
  const values = applicableSearchParams(raw, profile)
  const text = (key: SearchKey) => {
    const value = values[key]
    return typeof value === 'string' ? value.trim() || undefined : value
  }
  const number = (key: SearchKey) => {
    const value = text(key)
    return value === undefined ? undefined : typeof value === 'string' && /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : NaN
  }
  const range = (min: SearchKey, max: SearchKey) => {
    const result = { min: number(min), max: number(max) }
    return result.min === undefined && result.max === undefined ? undefined : result
  }
  const boolean = (key: SearchKey) => (text(key) === undefined ? undefined : text(key) === 'true' ? true : text(key) === 'false' ? false : text(key))
  const base = listingFiltersSchema.safeParse({ query: text('q'), category: text('category'), district: text('district'), area: text('area') })
  const property =
    profile.kind === 'property'
      ? {
          propertyType: text('propertyType'),
          bedrooms: range('minBedrooms', 'maxBedrooms'),
          bathrooms: range('minBathrooms', 'maxBathrooms'),
          propertyArea: range('minPropertyArea', 'maxPropertyArea'),
          plotArea: range('minPlotArea', 'maxPlotArea'),
          constructionYear: range('minConstructionYear', 'maxConstructionYear'),
          parking: text('parking'),
          furnishing: text('furnishing'),
          airConditioning: boolean('airConditioning'),
          petsAllowed: boolean('petsAllowed'),
          energyRating: text('energyRating'),
          amenities: typeof text('amenities') === 'string' ? String(text('amenities')).split(',') : text('amenities')
        }
      : undefined
  const vehicle =
    profile.kind === 'vehicle'
      ? {
          make: text('make'),
          model: text('model'),
          year: range('minYear', 'maxYear'),
          mileage: range('minMileage', 'maxMileage'),
          fuel: text('fuel'),
          transmission: text('transmission'),
          bodyType: text('bodyType'),
          engineCapacity: range('minEngineCapacity', 'maxEngineCapacity'),
          seats: number('seats'),
          condition: text('condition')
        }
      : undefined
  const compact = <T extends object>(value: T | undefined) => (value && Object.values(value).some((item) => item !== undefined) ? value : undefined)
  const attributes = createListingAttributeFiltersSchema(profile).safeParse({
    price: range('minPrice', 'maxPrice'),
    currency: text('currency'),
    pricePeriod: text('pricePeriod'),
    seller: text('seller'),
    sort: text('sort'),
    property: compact(property),
    vehicle: compact(vehicle)
  })
  const message = (issue: { path: PropertyKey[]; message: string }) => {
    const field = String(issue.path[issue.path[0] === 'property' || issue.path[0] === 'vehicle' ? 1 : 0] ?? 'filters')
    const label =
      field === 'query'
        ? 'Search'
        : (Object.entries(FILTER_LABELS).find(([key]) => key === field)?.[1] ?? filterLabel(field.replace(/([a-z])([A-Z])/g, '$1 $2')))
    return `${label}: ${issue.message}`
  }
  if (!base.success) return { success: false as const, message: message(base.error.issues[0]) }
  if (!attributes.success) return { success: false as const, message: message(attributes.error.issues[0]) }
  return { success: true as const, base: base.data, attributes: attributes.data }
}
