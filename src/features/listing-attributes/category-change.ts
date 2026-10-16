import type { PropertyType } from '@/generated/prisma/enums'
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
export function previewCategoryAttributeChange(categorySlug: string, current: ListingAttributes, propertyType?: PropertyType) {
  const profile = getCategoryAttributeProfile(categorySlug)
  const attributes = structuredClone(current)
  const removedFields: string[] = []
  if (attributes.pricePeriod !== null && (profile.kind !== 'property' || !profile.pricePeriods.includes(attributes.pricePeriod))) {
    attributes.pricePeriod = null
    removedFields.push('pricePeriod')
  }
  const property = attributes.propertyDetails
  if (property !== null) {
    const nextType =
      profile.kind === 'property'
        ? (propertyType ??
          (profile.propertyTypes.includes(property.propertyType)
            ? property.propertyType
            : profile.propertyTypes.length === 1
              ? profile.propertyTypes[0]
              : undefined))
        : undefined
    if (profile.kind !== 'property' || !nextType) {
      attributes.propertyDetails = null
      removedFields.push('propertyDetails')
    } else {
      property.propertyType = nextType
      const allowed = getPropertyFields(profile, property.propertyType)
      for (const field of PROPERTY_FIELDS) {
        if (field !== 'amenities' && !allowed.includes(field)) {
          if (property[field] != null) removedFields.push(`propertyDetails.${field}`)
          property[field] = null
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
          vehicle[field] = null
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

// A discriminator-only legacy/default row contains no entered characteristics.
// Confirm before losing even one entered value; empty optional fields are harmless.
export function hasEnteredAttributeLoss(current: ListingAttributes, removedFields: string[]) {
  return removedFields.some((path) => {
    if (path === 'pricePeriod') return current.pricePeriod !== null
    const [section, field] = path.split('.')
    const details = section === 'propertyDetails' ? current.propertyDetails : current.vehicleDetails
    if (!details) return false
    return Object.entries(details).some(
      ([key, value]) =>
        (!field || key === field) &&
        key !== 'propertyType' &&
        key !== 'vehicleType' &&
        value != null &&
        (Array.isArray(value) ? value.length > 0 : value !== '')
    )
  })
}

// A correction is a full explicit replacement. Require acknowledgement when
// changing category/type removes entered characteristics, including entire rows.
export function getIncompatibleAttributeLoss(categorySlug: string, previous: ListingAttributes, next: ListingAttributes) {
  const { removedFields } = previewCategoryAttributeChange(categorySlug, previous, next.propertyDetails?.propertyType)
  if (previous.propertyDetails && !next.propertyDetails) removedFields.push('propertyDetails')
  if (previous.vehicleDetails && !next.vehicleDetails) removedFields.push('vehicleDetails')
  return [...new Set(removedFields)].filter((path) => hasEnteredAttributeLoss(previous, [path]))
}
