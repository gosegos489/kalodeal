import { z } from 'zod'
import { getListingWhere } from '@/entities/listing/listing-where'
import { type ListingFilters, listingFiltersSchema } from '@/entities/listing/schema'
import type { Prisma } from '@/generated/prisma/client'
import {
  AccountType,
  ListingCurrency,
  ListingPricePeriod,
  PropertyAmenity,
  PropertyEnergyRating,
  PropertyFurnishing,
  PropertyParking,
  PropertyType,
  VehicleBodyType,
  VehicleCondition,
  VehicleFuel,
  VehicleTransmission
} from '@/generated/prisma/enums'
import { type CategoryAttributeProfile, getPropertyAmenities, getPropertyFields, getVehicleBodyTypes, getVehicleFields } from './rules'
import { ATTRIBUTE_LIMITS } from './schema'
import { isVehicleMake, isVehicleModel } from './vehicle-catalog'

const range = (schema: z.ZodNumber) =>
  z.strictObject({ min: schema.optional(), max: schema.optional() }).refine(({ min, max }) => min === undefined || max === undefined || min <= max, {
    path: ['max'],
    message: 'The maximum must be at least the minimum.'
  })
const integer = (min: number, max: number) => z.number().int().min(min).max(max)
const surface = (max: number) => range(z.number().positive().max(max).multipleOf(0.01)).optional()

const filtersSchema = z.strictObject({
  price: range(z.number().min(0).max(999_999_999.99).multipleOf(0.01)).optional(),
  currency: z.enum(ListingCurrency).optional(),
  pricePeriod: z.enum(['ONE_OFF', ...Object.values(ListingPricePeriod)]).optional(),
  seller: z.enum(AccountType).optional(),
  sort: z.enum(['RECENT', 'OLDEST', 'PRICE_LOW', 'PRICE_HIGH']).default('RECENT'),
  property: z
    .strictObject({
      propertyType: z.enum(PropertyType).optional(),
      bedrooms: range(integer(0, ATTRIBUTE_LIMITS.rooms)).optional(),
      bathrooms: range(integer(0, ATTRIBUTE_LIMITS.rooms)).optional(),
      propertyArea: surface(ATTRIBUTE_LIMITS.propertyArea),
      plotArea: surface(ATTRIBUTE_LIMITS.plotArea),
      constructionYear: range(integer(ATTRIBUTE_LIMITS.constructionYearMin, ATTRIBUTE_LIMITS.yearMax)).optional(),
      parking: z.enum(PropertyParking).optional(),
      furnishing: z.enum(PropertyFurnishing).optional(),
      airConditioning: z.boolean().optional(),
      petsAllowed: z.boolean().optional(),
      amenities: z
        .array(z.enum(PropertyAmenity))
        .max(Object.keys(PropertyAmenity).length)
        .refine((items) => new Set(items).size === items.length)
        .optional(),
      energyRating: z.enum(PropertyEnergyRating).optional()
    })
    .optional(),
  vehicle: z
    .strictObject({
      make: z.string().min(1).max(40).optional(),
      model: z.string().min(1).max(60).optional(),
      year: range(integer(ATTRIBUTE_LIMITS.vehicleYearMin, ATTRIBUTE_LIMITS.yearMax)).optional(),
      mileage: range(integer(0, ATTRIBUTE_LIMITS.mileage)).optional(),
      fuel: z.enum(VehicleFuel).optional(),
      transmission: z.enum(VehicleTransmission).optional(),
      bodyType: z.enum(VehicleBodyType).optional(),
      engineCapacity: range(integer(1, ATTRIBUTE_LIMITS.engineCapacity)).optional(),
      seats: integer(1, ATTRIBUTE_LIMITS.seats).optional(),
      condition: z.enum(VehicleCondition).optional()
    })
    .optional()
})
export type ListingAttributeFilters = z.output<typeof filtersSchema>

// Shared by URL validation and the server query. Comparing prices always fixes
// both currency and period, including a mixed/all-category search.
export function createListingAttributeFiltersSchema(profile: CategoryAttributeProfile, now = new Date()) {
  return filtersSchema.superRefine((data, ctx) => {
    const issue = (path: string[], message: string) => ctx.addIssue({ code: 'custom', path, message })
    const comparesPrices = data.price?.min !== undefined || data.price?.max !== undefined || data.sort === 'PRICE_LOW' || data.sort === 'PRICE_HIGH'
    if (comparesPrices && !data.currency) issue(['currency'], 'Choose a currency before comparing prices.')
    if (comparesPrices && !data.pricePeriod)
      issue(
        ['pricePeriod'],
        profile.kind === 'property' && profile.transaction === 'rent'
          ? 'Choose a rental period before comparing prices.'
          : 'Choose a price period before comparing prices.'
      )
    if (profile.kind === 'property' && profile.transaction === 'rent') {
      if (data.pricePeriod && (data.pricePeriod === 'ONE_OFF' || !profile.pricePeriods.includes(data.pricePeriod)))
        issue(['pricePeriod'], 'Choose an allowed rental period.')
    } else if (profile.kind !== 'generic' && data.pricePeriod && data.pricePeriod !== 'ONE_OFF')
      issue(['pricePeriod'], 'This category uses a one-off price.')
    if (data.property) {
      if (profile.kind !== 'property') issue(['property'], 'Property filters do not apply to this category.')
      else {
        if (data.property.propertyType && !profile.propertyTypes.includes(data.property.propertyType))
          issue(['property', 'propertyType'], 'Choose an allowed property type.')
        const types = data.property.propertyType ? [data.property.propertyType] : profile.propertyTypes
        for (const field of [
          'bedrooms',
          'bathrooms',
          'propertyArea',
          'plotArea',
          'constructionYear',
          'parking',
          'furnishing',
          'airConditioning',
          'petsAllowed',
          'amenities',
          'energyRating'
        ] as const) {
          if (data.property[field] !== undefined && !types.some((type) => getPropertyFields(profile, type).includes(field)))
            issue(['property', field], 'This filter does not apply to the selected property type.')
        }
        if (data.property.amenities?.some((amenity) => !types.some((type) => getPropertyAmenities(type).includes(amenity))))
          issue(['property', 'amenities'], 'Choose amenities that apply to this property type.')
        if ((data.property.constructionYear?.max ?? data.property.constructionYear?.min ?? 0) > now.getUTCFullYear() + 1)
          issue(['property', 'constructionYear'], 'Choose a year no later than next year.')
      }
    }
    if (data.vehicle) {
      const { make, model, year } = data.vehicle
      if (profile.kind !== 'vehicle') issue(['vehicle'], 'Vehicle filters do not apply to this category.')
      else {
        if (make && !isVehicleMake(make, profile.vehicleType)) issue(['vehicle', 'make'], 'Choose a supported make for this vehicle type.')
        if (model && (!make || !isVehicleModel(make, model, profile.vehicleType)))
          issue(['vehicle', 'model'], 'Choose a model belonging to this make and vehicle type.')
        if (data.vehicle.bodyType && !getVehicleBodyTypes(profile.vehicleType).includes(data.vehicle.bodyType))
          issue(['vehicle', 'bodyType'], 'Choose a body type for this vehicle category.')
        for (const field of ['bodyType', 'engineCapacity', 'seats', 'condition'] as const)
          if (data.vehicle[field] !== undefined && !getVehicleFields(profile.vehicleType).includes(field))
            issue(['vehicle', field], 'This filter does not apply to this vehicle category.')
        if (profile.vehicleType === 'MOTORCYCLE' && (data.vehicle.seats ?? 0) > 2)
          issue(['vehicle', 'seats'], 'Use one or two seats for a motorcycle.')
        if (data.vehicle.fuel === 'ELECTRIC' && data.vehicle.engineCapacity)
          issue(['vehicle', 'engineCapacity'], 'Electric vehicles do not have combustion engine capacity.')
      }
      if ((year?.min ?? 0) > now.getUTCFullYear() + 1 || (year?.max ?? 0) > now.getUTCFullYear() + 1)
        issue(['vehicle', 'year'], 'Choose a year no later than next year.')
    }
  })
}

function sqlRange(value: { min?: number; max?: number } | undefined) {
  return value && { ...(value.min !== undefined ? { gte: value.min } : {}), ...(value.max !== undefined ? { lte: value.max } : {}) }
}

export function buildListingAttributeQuery(base: ListingFilters, profile: CategoryAttributeProfile, input: unknown, now = new Date()) {
  const filters = createListingAttributeFiltersSchema(profile, now).parse(input)
  const property = filters.property
  const vehicle = filters.vehicle
  const where: Prisma.ListingWhereInput = {
    ...getListingWhere(listingFiltersSchema.parse(base)),
    user: {
      ...(filters.seller && { accountType: filters.seller }),
      AND: [{ OR: [{ role: null }, { role: { not: 'moderator' } }] }, { OR: [{ banned: null }, { banned: false }, { banExpires: { lte: now } }] }]
    },
    ...(filters.currency && { currency: filters.currency }),
    ...(filters.pricePeriod && { pricePeriod: filters.pricePeriod === 'ONE_OFF' ? null : filters.pricePeriod }),
    // A null period on a legacy rental is unknown, never a one-off price.
    ...(filters.pricePeriod === 'ONE_OFF' && {
      NOT: {
        category: {
          OR: [
            { slug: 'property-for-rent' },
            { parent: { is: { slug: 'property-for-rent' } } },
            { parent: { is: { parent: { is: { slug: 'property-for-rent' } } } } }
          ]
        }
      }
    }),
    ...(filters.price && { price: sqlRange(filters.price) }),
    ...(property &&
      profile.kind === 'property' && {
        propertyDetails: {
          is: {
            propertyType: property.propertyType ?? { in: [...profile.propertyTypes] },
            bedrooms: sqlRange(property.bedrooms),
            bathrooms: sqlRange(property.bathrooms),
            propertyArea: sqlRange(property.propertyArea),
            plotArea: sqlRange(property.plotArea),
            constructionYear: sqlRange(property.constructionYear),
            parking: property.parking,
            furnishing: property.furnishing,
            airConditioning: property.airConditioning,
            petsAllowed: property.petsAllowed,
            amenities: property.amenities?.length ? { hasEvery: property.amenities } : undefined,
            energyRating: property.energyRating
          }
        }
      }),
    ...(vehicle &&
      profile.kind === 'vehicle' && {
        vehicleDetails: {
          is: {
            vehicleType: profile.vehicleType,
            make: vehicle.make,
            model: vehicle.model,
            year: sqlRange(vehicle.year),
            mileage: sqlRange(vehicle.mileage),
            fuel: vehicle.fuel,
            transmission: vehicle.transmission,
            bodyType: vehicle.bodyType,
            engineCapacity: sqlRange(vehicle.engineCapacity),
            seats: vehicle.seats,
            condition: vehicle.condition
          }
        }
      })
  }
  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    ...(filters.sort === 'PRICE_LOW' || filters.sort === 'PRICE_HIGH'
      ? [{ price: { sort: filters.sort === 'PRICE_LOW' ? ('asc' as const) : ('desc' as const), nulls: 'last' as const } }]
      : []),
    { sortDate: filters.sort === 'OLDEST' ? 'asc' : 'desc' },
    { id: filters.sort === 'OLDEST' ? 'asc' : 'desc' }
  ]
  return { where, orderBy }
}
