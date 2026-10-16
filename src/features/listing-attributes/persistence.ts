import type { Prisma } from '@/generated/prisma/client'
import type { CategoryAttributeProfile } from './rules'
import { createCategoryAttributesSchema } from './schema'
import type { ListingAttributes } from './schema'

export const listingAttributeSelect = {
  priceNegotiable: true,
  pricePeriod: true,
  propertyDetails: { omit: { listingId: true } },
  vehicleDetails: { omit: { listingId: true } }
} as const satisfies Prisma.ListingSelect

type StoredListingAttributes = Prisma.ListingGetPayload<{ select: typeof listingAttributeSelect }>

export function serializeListingAttributes(listing: StoredListingAttributes): ListingAttributes {
  return {
    priceNegotiable: listing.priceNegotiable,
    pricePeriod: listing.pricePeriod,
    vehicleDetails: listing.vehicleDetails,
    propertyDetails: listing.propertyDetails && {
      ...listing.propertyDetails,
      plotArea: listing.propertyDetails.plotArea?.toNumber() ?? null,
      propertyArea: listing.propertyDetails.propertyArea?.toNumber() ?? null
    }
  }
}

export function listingAttributesEqual(first: ListingAttributes, second: ListingAttributes) {
  return JSON.stringify(normalizeListingAttributes(first)) === JSON.stringify(normalizeListingAttributes(second))
}

// Builds data only: no endpoint, no authorization, no database operation.
// Callers must use a trusted DB profile and the existing authorized,
// owner-locked + listing-locked, version-checked lifecycle transaction.
// Full replacement is explicit. Omitting this operation preserves all attributes.
export function buildListingAttributeReplacement(
  profile: CategoryAttributeProfile,
  price: string | number | null,
  input: unknown,
  existing: { propertyDetails: boolean; vehicleDetails: boolean }
) {
  const attributes = createCategoryAttributesSchema(profile, price).parse(input)
  const { propertyDetails: propertyData, vehicleDetails: vehicleData } = normalizeListingAttributes(attributes)
  return {
    priceNegotiable: attributes.priceNegotiable,
    pricePeriod: attributes.pricePeriod,
    propertyDetails: propertyData
      ? { upsert: { create: propertyData, update: propertyData } }
      : existing.propertyDetails
        ? { delete: true }
        : undefined,
    vehicleDetails: vehicleData ? { upsert: { create: vehicleData, update: vehicleData } } : existing.vehicleDetails ? { delete: true } : undefined
  } satisfies Prisma.ListingUpdateInput
}

export function buildListingAttributeCreate(attributes: ListingAttributes) {
  const normalized = normalizeListingAttributes(attributes)
  return {
    priceNegotiable: normalized.priceNegotiable,
    pricePeriod: normalized.pricePeriod,
    ...(normalized.propertyDetails ? { propertyDetails: { create: normalized.propertyDetails } } : {}),
    ...(normalized.vehicleDetails ? { vehicleDetails: { create: normalized.vehicleDetails } } : {})
  }
}

function normalizeListingAttributes(attributes: ListingAttributes) {
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
    amenities: [...property.amenities].sort()
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
    propertyDetails: propertyData,
    vehicleDetails: vehicleData
  }
}
