import { PROPERTY_FIELDS, VEHICLE_FIELDS, getCategoryAttributeProfile, getPropertyAmenities, getPropertyFields, getVehicleFields } from './rules'
import { type ListingAttributes, createCategoryAttributesSchema } from './schema'
import { OTHER_VEHICLE_MAKE, OTHER_VEHICLE_MODEL, isVehicleMake, isVehicleModel } from './vehicle-catalog'

// Used by the existing category-only editors, which cannot explicitly replace
// attributes yet. Empty legacy records remain editable without invented details.
export function canRetainListingAttributes(categorySlug: string, price: string | number | null, attributes: ListingAttributes) {
  if (attributes.propertyDetails === null && attributes.vehicleDetails === null && attributes.pricePeriod === null) return true
  return createCategoryAttributesSchema(getCategoryAttributeProfile(categorySlug), price).safeParse(attributes).success
}

// UI preview only. Never silently use this to clean a server submission: validate
// the full explicit replacement with createCategoryAttributesSchema instead.
// The original object remains intact; removedFields must be shown to the owner.
export function previewCategoryAttributeChange(categorySlug: string, current: ListingAttributes) {
  const profile = getCategoryAttributeProfile(categorySlug)
  const attributes = structuredClone(current)
  const removedFields: string[] = []
  if (attributes.pricePeriod !== null && (profile.kind !== 'property' || !profile.pricePeriods.includes(attributes.pricePeriod))) {
    attributes.pricePeriod = null
    removedFields.push('pricePeriod')
  }
  const property = attributes.propertyDetails
  if (property !== null) {
    if (profile.kind !== 'property' || !profile.propertyTypes.includes(property.propertyType)) {
      attributes.propertyDetails = null
      removedFields.push('propertyDetails')
    } else {
      const allowed = getPropertyFields(profile, property.propertyType)
      for (const field of PROPERTY_FIELDS) {
        if (field !== 'amenities' && !allowed.includes(field)) {
          if (property[field] != null) removedFields.push(`propertyDetails.${field}`)
          delete property[field]
        }
      }
      const amenities = property.amenities.filter((item) => getPropertyAmenities(property.propertyType).includes(item))
      if (amenities.length !== property.amenities.length) removedFields.push('propertyDetails.amenities')
      property.amenities = amenities
    }
  }
  const vehicle = attributes.vehicleDetails
  if (vehicle !== null) {
    if (profile.kind !== 'vehicle' || vehicle.vehicleType !== profile.vehicleType) {
      attributes.vehicleDetails = null
      removedFields.push('vehicleDetails')
    } else {
      const allowed = getVehicleFields(profile.vehicleType)
      for (const field of VEHICLE_FIELDS) {
        if (!allowed.includes(field)) {
          if (vehicle[field] != null) removedFields.push(`vehicleDetails.${field}`)
          delete vehicle[field]
        }
      }
      if (vehicle.make != null && !isVehicleMake(vehicle.make, profile.vehicleType)) {
        vehicle.make = null
        removedFields.push('vehicleDetails.make')
      }
      if (vehicle.model != null && (vehicle.make == null || !isVehicleModel(vehicle.make, vehicle.model, profile.vehicleType))) {
        vehicle.model = null
        removedFields.push('vehicleDetails.model')
      }
      if (vehicle.make !== OTHER_VEHICLE_MAKE && vehicle.otherMake != null) {
        vehicle.otherMake = null
        removedFields.push('vehicleDetails.otherMake')
      }
      if (vehicle.model !== OTHER_VEHICLE_MODEL && vehicle.otherModel != null) {
        vehicle.otherModel = null
        removedFields.push('vehicleDetails.otherModel')
      }
    }
  }
  return { attributes, removedFields }
}
