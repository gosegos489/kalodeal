import type { Prisma } from '@/generated/prisma/client'
import type { CategoryAttributeProfile } from './rules'
import { createCategoryAttributesSchema } from './schema'

// Builds data only: no endpoint, no authorization, no database operation.
// A future caller must use a trusted DB profile and the existing authorized,
// owner-locked + listing-locked, version-checked lifecycle transaction.
// Full replacement is explicit. Omitting this operation preserves all attributes.
export function buildListingAttributeReplacement(
  profile: CategoryAttributeProfile,
  price: string | number | null,
  input: unknown,
  existing: { propertyDetails: boolean; vehicleDetails: boolean }
): Prisma.ListingUpdateInput {
  const attributes = createCategoryAttributesSchema(profile, price).parse(input)
  const property = attributes.propertyDetails
  const vehicle = attributes.vehicleDetails
  // Set every optional column to null on replacement. Prisma ignores undefined,
  // which would otherwise retain stale values after a form hides an old field.
  const propertyData = property && {
    propertyType: property.propertyType,
    plotArea: property.plotArea ?? null,
    propertyArea: property.propertyArea ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    constructionYear: property.constructionYear ?? null,
    parking: property.parking ?? null,
    airConditioning: property.airConditioning ?? null,
    furnishing: property.furnishing ?? null,
    petsAllowed: property.petsAllowed ?? null,
    onlineViewing: property.onlineViewing ?? null,
    energyRating: property.energyRating ?? null,
    postalCode: property.postalCode ?? null,
    amenities: property.amenities
  }
  const vehicleData = vehicle && {
    vehicleType: vehicle.vehicleType,
    make: vehicle.make ?? null,
    model: vehicle.model ?? null,
    otherMake: vehicle.otherMake ?? null,
    otherModel: vehicle.otherModel ?? null,
    year: vehicle.year ?? null,
    mileage: vehicle.mileage ?? null,
    fuel: vehicle.fuel ?? null,
    transmission: vehicle.transmission ?? null,
    bodyType: vehicle.bodyType ?? null,
    engineCapacity: vehicle.engineCapacity ?? null,
    seats: vehicle.seats ?? null,
    doors: vehicle.doors ?? null,
    condition: vehicle.condition ?? null,
    color: vehicle.color ?? null
  }
  return {
    priceNegotiable: attributes.priceNegotiable,
    pricePeriod: attributes.pricePeriod,
    ...(propertyData
      ? { propertyDetails: { upsert: { create: propertyData, update: propertyData } } }
      : existing.propertyDetails
        ? { propertyDetails: { delete: true } }
        : {}),
    ...(vehicleData
      ? { vehicleDetails: { upsert: { create: vehicleData, update: vehicleData } } }
      : existing.vehicleDetails
        ? { vehicleDetails: { delete: true } }
        : {})
  }
}
