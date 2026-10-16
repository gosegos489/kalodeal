import { PROPERTY_FIELDS, VEHICLE_FIELDS } from '@/features/listing-attributes/rules'
import type { ListingAttributes } from '@/features/listing-attributes/schema'
import type { CreateListingInput } from './types'

const hasEnteredValue = (details: object) => Object.values(details).some((value) => value != null && (!Array.isArray(value) || value.length > 0))

// Nested Controllers turn a null RHF parent into an object of undefined values.
// Normalize only that empty UI state. Server schemas still reject malformed rows.
export function normalizeEmptyFormDetails<T extends Pick<CreateListingInput, 'propertyDetails' | 'vehicleDetails'>>(values: T): T {
  const property = values.propertyDetails
  const vehicle = values.vehicleDetails
  return {
    ...values,
    propertyDetails: property && !hasEnteredValue(property) ? null : property,
    vehicleDetails: vehicle && !hasEnteredValue(vehicle) ? null : vehicle
  }
}

// Explicit nulls override saved child defaults when an RHF section remounts.
// Cleared values must never reappear after switching back to a previous category.
export function fillAttributeFormDefaults(attributes: ListingAttributes): ListingAttributes {
  return {
    ...attributes,
    propertyDetails: attributes.propertyDetails && {
      ...Object.fromEntries(PROPERTY_FIELDS.filter((field) => field !== 'amenities').map((field) => [field, null])),
      ...attributes.propertyDetails,
      amenities: attributes.propertyDetails.amenities ?? []
    },
    vehicleDetails: attributes.vehicleDetails && {
      ...Object.fromEntries(VEHICLE_FIELDS.map((field) => [field, null])),
      ...attributes.vehicleDetails
    }
  }
}
