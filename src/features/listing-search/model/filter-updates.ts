import { getDistrict, isAreaInDistrict } from '@/entities/location/catalog'
import { getCategoryAttributeProfile, getPropertyAmenities } from '@/features/listing-attributes/rules'
import { isVehicleModel } from '@/features/listing-attributes/vehicle-catalog'
import { PropertyType } from '@/generated/prisma/enums'
import { type FilterUpdates, PROPERTY_FILTER_KEYS, type SearchFilters, VEHICLE_FILTER_KEYS, applicableSearchParams } from './search-params'

export type { FilterUpdates, SearchFilters } from './search-params'

// Dependencies are repaired in the same atomic nuqs update, also used for the
// unsaved filter form. No mounting effect or follow-up navigation is required.
export function getFilterUpdate(current: SearchFilters, updates: FilterUpdates): FilterUpdates {
  const patch = { ...updates }
  if (('currency' in updates && !updates.currency) || ('pricePeriod' in updates && !updates.pricePeriod)) {
    patch.minPrice = null
    patch.maxPrice = null
    if (current.sort === 'PRICE_LOW' || current.sort === 'PRICE_HIGH') patch.sort = null
  }
  if ('category' in updates && updates.category !== current.category) {
    for (const key of [...PROPERTY_FILTER_KEYS, ...VEHICLE_FILTER_KEYS]) patch[key] = null
    const profile = getCategoryAttributeProfile(updates.category ?? '')
    const previousProfile = getCategoryAttributeProfile(current.category)
    const leavesRental =
      previousProfile.kind === 'property' &&
      previousProfile.transaction === 'rent' &&
      !(profile.kind === 'property' && profile.transaction === 'rent')
    const period = updates.pricePeriod ?? current.pricePeriod
    const compatiblePeriod =
      !leavesRental &&
      (!period ||
        profile.kind === 'generic' ||
        (profile.kind === 'property' && profile.transaction === 'rent'
          ? profile.pricePeriods.some((value) => value === period)
          : period === 'ONE_OFF'))
    if (!compatiblePeriod) {
      patch.pricePeriod = null
      patch.minPrice = null
      patch.maxPrice = null
      if (current.sort === 'PRICE_LOW' || current.sort === 'PRICE_HIGH') patch.sort = null
    }
  }
  const next = { ...current, ...patch }
  const profile = getCategoryAttributeProfile(next.category ?? '')
  const district = getDistrict(next.district ?? '')?.slug ?? null
  const area = district && isAreaInDistrict(district, next.area ?? '') ? next.area : null
  patch.district = district
  patch.area = area
  const applicable = applicableSearchParams(Object.fromEntries(Object.entries(next).map(([key, value]) => [key, value ?? undefined])), profile)
  for (const key of [...PROPERTY_FILTER_KEYS, ...VEHICLE_FILTER_KEYS]) if (next[key] && !applicable[key]) patch[key] = null
  if (profile.kind === 'property' && 'propertyType' in updates) {
    const type = Object.values(PropertyType).find((type) => type === updates.propertyType)
    const types = type ? [type] : profile.propertyTypes
    patch.amenities =
      (next.amenities ?? '')
        .split(',')
        .filter((amenity) => types.some((type) => getPropertyAmenities(type).some((item) => item === amenity)))
        .join(',') || null
  }
  if (profile.kind === 'vehicle' && 'make' in updates && updates.make !== current.make) patch.model = null
  else if (profile.kind === 'vehicle' && next.model && (!next.make || !isVehicleModel(next.make, next.model, profile.vehicleType))) patch.model = null
  patch.page = null
  return patch
}
