import { type ListingPricePeriod, type PropertyAmenity, type PropertyType, VehicleBodyType, type VehicleType } from '@/generated/prisma/enums'

export type CategoryAttributeProfile =
  | { kind: 'generic' }
  | { kind: 'property'; transaction: 'sale' | 'rent'; propertyTypes: readonly PropertyType[]; pricePeriods: readonly ListingPricePeriod[] }
  | { kind: 'vehicle'; vehicleType: VehicleType }

const sale = (propertyTypes: readonly PropertyType[]): CategoryAttributeProfile => ({
  kind: 'property',
  transaction: 'sale',
  propertyTypes,
  pricePeriods: []
})
const rent = (
  propertyTypes: readonly PropertyType[],
  pricePeriods: readonly ListingPricePeriod[] = ['WEEK', 'MONTH', 'YEAR']
): CategoryAttributeProfile => ({ kind: 'property', transaction: 'rent', propertyTypes, pricePeriods })
const allPropertyTypes = ['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'ROOM', 'OTHER'] as const

// Exact slugs, never name/prefix heuristics. Resolve the selected ID from the DB
// before using its slug on the server. Unknown categories stay generic.
const categoryProfiles: Readonly<Record<string, CategoryAttributeProfile>> = {
  'property-for-sale': sale(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER']),
  'property-for-sale-houses': sale(['HOUSE']),
  'property-for-sale-apartments': sale(['APARTMENT']),
  'property-for-sale-commercial': sale(['COMMERCIAL']),
  'property-for-sale-land': sale(['LAND']),
  'property-for-sale-other': sale(['OTHER']),
  'property-for-rent': rent(allPropertyTypes, ['DAY', 'WEEK', 'MONTH', 'YEAR']),
  'property-for-rent-houses': rent(['HOUSE']),
  'property-for-rent-apartments': rent(['APARTMENT']),
  'property-for-rent-commercial': rent(['COMMERCIAL'], ['MONTH', 'YEAR']),
  'property-for-rent-land': rent(['LAND'], ['MONTH', 'YEAR']),
  'property-for-rent-rooms': rent(['ROOM']),
  'property-for-rent-short-term': rent(['HOUSE', 'APARTMENT', 'ROOM', 'OTHER'], ['DAY', 'WEEK']),
  'property-for-rent-other': rent(['OTHER'], ['DAY', 'WEEK', 'MONTH', 'YEAR']),
  'motors-cars': { kind: 'vehicle', vehicleType: 'CAR' },
  'motors-motorcycles': { kind: 'vehicle', vehicleType: 'MOTORCYCLE' },
  'motors-vans': { kind: 'vehicle', vehicleType: 'VAN' }
}

export function getCategoryAttributeProfile(categorySlug: string): CategoryAttributeProfile {
  return Object.hasOwn(categoryProfiles, categorySlug) ? categoryProfiles[categorySlug] : { kind: 'generic' }
}

export const PROPERTY_FIELDS = [
  'plotArea',
  'propertyArea',
  'bedrooms',
  'bathrooms',
  'constructionYear',
  'parking',
  'airConditioning',
  'furnishing',
  'petsAllowed',
  'onlineViewing',
  'energyRating',
  'postalCode',
  'amenities'
] as const
export type PropertyField = (typeof PROPERTY_FIELDS)[number]

export function getPropertyFields(profile: Extract<CategoryAttributeProfile, { kind: 'property' }>, propertyType: PropertyType): PropertyField[] {
  const fields: PropertyField[] = ['onlineViewing', 'postalCode', 'amenities']
  if (propertyType === 'LAND') return [...fields, 'plotArea']
  fields.push('propertyArea', 'constructionYear', 'parking', 'airConditioning', 'energyRating')
  if (propertyType === 'HOUSE' || propertyType === 'COMMERCIAL' || propertyType === 'OTHER') fields.push('plotArea')
  if (propertyType === 'HOUSE' || propertyType === 'APARTMENT' || propertyType === 'ROOM') {
    fields.push('bedrooms', 'bathrooms', 'furnishing')
    if (profile.transaction === 'rent') fields.push('petsAllowed')
  } else if (propertyType === 'COMMERCIAL' || propertyType === 'OTHER') fields.push('bathrooms')
  return fields
}

export function getPropertyAmenities(propertyType: PropertyType): readonly PropertyAmenity[] {
  if (propertyType === 'LAND') return ['GARDEN']
  if (propertyType === 'COMMERCIAL') return ['POOL', 'GARDEN', 'ELEVATOR', 'ALARM', 'BALCONY', 'STORAGE_ROOM']
  return ['POOL', 'GARDEN', 'ELEVATOR', 'ALARM', 'FIREPLACE', 'BALCONY', 'PLAYROOM', 'ATTIC_LOFT', 'STORAGE_ROOM']
}

export const VEHICLE_FIELDS = [
  'make',
  'model',
  'otherMake',
  'otherModel',
  'year',
  'mileage',
  'fuel',
  'transmission',
  'bodyType',
  'engineCapacity',
  'seats',
  'doors',
  'condition',
  'color'
] as const
export type VehicleField = (typeof VEHICLE_FIELDS)[number]

export function getVehicleFields(vehicleType: VehicleType): readonly VehicleField[] {
  return vehicleType === 'MOTORCYCLE' ? VEHICLE_FIELDS.filter((field) => field !== 'doors' && field !== 'bodyType') : VEHICLE_FIELDS
}

export function getVehicleBodyTypes(vehicleType: VehicleType): VehicleBodyType[] {
  if (vehicleType === 'MOTORCYCLE') return []
  return Object.values(VehicleBodyType).filter((body) =>
    vehicleType === 'VAN' ? ['PANEL_VAN', 'MINIBUS', 'PICKUP', 'OTHER'].includes(body) : !['PANEL_VAN', 'MINIBUS'].includes(body)
  )
}
