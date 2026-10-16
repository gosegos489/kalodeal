import { z } from 'zod'
import {
  ListingPricePeriod,
  PropertyAmenity,
  PropertyEnergyRating,
  PropertyFurnishing,
  PropertyParking,
  PropertyType,
  VehicleBodyType,
  VehicleColor,
  VehicleCondition,
  VehicleFuel,
  VehicleTransmission
} from '@/generated/prisma/enums'
import { type CategoryAttributeProfile, getPropertyAmenities, getPropertyFields, getVehicleBodyTypes, getVehicleFields } from './rules'
import { vehicleSelectionSchema } from './vehicle-selection'

export const ATTRIBUTE_LIMITS = {
  plotArea: 1_000_000_000,
  propertyArea: 1_000_000,
  rooms: 100,
  constructionYearMin: 1000,
  yearMax: 2100,
  vehicleYearMin: 1886,
  mileage: 10_000_000,
  engineCapacity: 100_000,
  seats: 100,
  doors: 10
} as const

const optional = <T extends z.ZodType>(schema: T) => schema.nullish()
const area = (max: number) => optional(z.number().positive().max(max).multipleOf(0.01))
const count = (min: number, max: number) => optional(z.number().int().min(min).max(max))

// Transport contracts use numbers, never unparsed FormData strings or Decimal
// instances. Form controls turn empty optional fields into null.
export const propertyDetailsSchema = z.strictObject({
  propertyType: z.enum(PropertyType),
  plotArea: area(ATTRIBUTE_LIMITS.plotArea),
  propertyArea: area(ATTRIBUTE_LIMITS.propertyArea),
  bedrooms: count(0, ATTRIBUTE_LIMITS.rooms),
  bathrooms: count(0, ATTRIBUTE_LIMITS.rooms),
  constructionYear: count(ATTRIBUTE_LIMITS.constructionYearMin, ATTRIBUTE_LIMITS.yearMax),
  parking: optional(z.enum(PropertyParking)),
  airConditioning: optional(z.boolean()),
  furnishing: optional(z.enum(PropertyFurnishing)),
  petsAllowed: optional(z.boolean()),
  onlineViewing: optional(z.boolean()),
  energyRating: optional(z.enum(PropertyEnergyRating)),
  postalCode: optional(
    z
      .string()
      .trim()
      .min(1)
      .max(16)
      .regex(/^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/)
  ),
  amenities: z
    .array(z.enum(PropertyAmenity))
    .max(Object.keys(PropertyAmenity).length)
    .refine((items) => new Set(items).size === items.length, 'Choose each amenity once.')
    .default([])
})

export const vehicleDetailsSchema = vehicleSelectionSchema.safeExtend({
  year: count(ATTRIBUTE_LIMITS.vehicleYearMin, ATTRIBUTE_LIMITS.yearMax),
  mileage: count(0, ATTRIBUTE_LIMITS.mileage),
  fuel: optional(z.enum(VehicleFuel)),
  transmission: optional(z.enum(VehicleTransmission)),
  bodyType: optional(z.enum(VehicleBodyType)),
  engineCapacity: count(1, ATTRIBUTE_LIMITS.engineCapacity),
  seats: count(1, ATTRIBUTE_LIMITS.seats),
  doors: count(1, ATTRIBUTE_LIMITS.doors),
  condition: optional(z.enum(VehicleCondition)),
  color: optional(z.enum(VehicleColor))
})

export const listingAttributeInputSchema = z.strictObject({
  priceNegotiable: z.boolean().default(false),
  pricePeriod: z.enum(ListingPricePeriod).nullable().default(null),
  propertyDetails: propertyDetailsSchema.nullable().default(null),
  vehicleDetails: vehicleDetailsSchema.nullable().default(null)
})
export type ListingAttributes = z.output<typeof listingAttributeInputSchema>
export type PropertyAttributes = z.output<typeof propertyDetailsSchema>
export type VehicleAttributes = z.output<typeof vehicleDetailsSchema>

// price is already parsed by the owning common Listing schema, not this payload.
// This schema intentionally has no owner/status/categoryId/entitlement fields.
export function createCategoryAttributesSchema(profile: CategoryAttributeProfile, price: string | number | null, now = new Date()) {
  const nextYear = Math.min(now.getUTCFullYear() + 1, ATTRIBUTE_LIMITS.yearMax)
  return listingAttributeInputSchema.superRefine((data, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })
    const { propertyDetails: property, vehicleDetails: vehicle, pricePeriod } = data
    const priced = price !== null && price !== ''
    if (profile.kind === 'property' && profile.transaction === 'rent') {
      if (priced && pricePeriod === null) issue(['pricePeriod'], 'Choose the rental price period.')
      if (pricePeriod !== null && !profile.pricePeriods.includes(pricePeriod))
        issue(['pricePeriod'], 'Choose a period allowed for this rental category.')
    } else if (pricePeriod !== null) issue(['pricePeriod'], 'This category uses a one-off price.')

    if (property !== null) {
      if (profile.kind !== 'property') issue(['propertyDetails'], 'Property details do not apply to this category.')
      else {
        if (!profile.propertyTypes.includes(property.propertyType))
          issue(['propertyDetails', 'propertyType'], 'Choose a property type allowed for this category.')
        const allowed = getPropertyFields(profile, property.propertyType)
        for (const [field, value] of Object.entries(property)) {
          if (field !== 'propertyType' && value !== null && value !== undefined && !allowed.some((item) => item === field)) {
            issue(['propertyDetails', field], 'Clear this field before changing the property category.')
          }
        }
        if (property.amenities.some((item) => !getPropertyAmenities(property.propertyType).includes(item)))
          issue(['propertyDetails', 'amenities'], 'Choose amenities that apply to this property type.')
      }
      if (property.constructionYear != null && property.constructionYear > nextYear)
        issue(['propertyDetails', 'constructionYear'], `Use a year no later than ${nextYear}.`)
    }
    if (vehicle !== null) {
      if (profile.kind !== 'vehicle') issue(['vehicleDetails'], 'Vehicle details do not apply to this category.')
      else {
        if (vehicle.vehicleType !== profile.vehicleType) issue(['vehicleDetails', 'vehicleType'], 'Choose the vehicle type for this category.')
        const allowed = getVehicleFields(profile.vehicleType)
        for (const [field, value] of Object.entries(vehicle)) {
          if (field !== 'vehicleType' && value !== null && value !== undefined && !allowed.some((item) => item === field))
            issue(['vehicleDetails', field], 'Clear this field before changing the vehicle category.')
        }
        if (profile.vehicleType === 'MOTORCYCLE' && vehicle.seats != null && vehicle.seats > 2)
          issue(['vehicleDetails', 'seats'], 'Use one or two seats for a motorcycle.')
        if (vehicle.bodyType != null && !getVehicleBodyTypes(profile.vehicleType).includes(vehicle.bodyType))
          issue(['vehicleDetails', 'bodyType'], 'Choose a body type allowed for this vehicle category.')
      }
      if (vehicle.fuel === 'ELECTRIC' && vehicle.engineCapacity != null)
        issue(['vehicleDetails', 'engineCapacity'], 'Electric vehicles do not have combustion engine capacity.')
      if (vehicle.year != null && vehicle.year > nextYear) issue(['vehicleDetails', 'year'], `Use a year no later than ${nextYear}.`)
    }
  })
}
