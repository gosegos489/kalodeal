import { z } from 'zod'
import { areaSchema, districtSchema, locationPairError, matchesLocation } from '@/entities/location/schema'
import { LISTING_QUERY_MAX_LENGTH } from './constants'

export const listingIdSchema = z.union([z.string().uuid(), z.string().cuid()])

export const listingFiltersSchema = z
  .object({
    query: z.string().trim().max(LISTING_QUERY_MAX_LENGTH).optional(),
    category: z
      .string()
      .trim()
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    district: districtSchema.optional(),
    area: areaSchema.optional()
  })
  .strict()
  .refine(matchesLocation, locationPairError)

export type ListingFilters = z.infer<typeof listingFiltersSchema>
