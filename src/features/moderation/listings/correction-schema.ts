import { z } from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'
import { listingLocationSchema } from '@/entities/location/schema'
import { listingDetailsSchema } from '@/features/create-listing/schema'
import { listingAttributeInputSchema } from '@/features/listing-attributes/schema'
import type { ListingCurrency, ListingStatus } from '@/generated/prisma/enums'

export const listingCorrectionFieldsSchema = z
  .strictObject({
    categoryId: listingDetailsSchema.shape.categoryId,
    district: listingLocationSchema.shape.district.nullable(),
    area: listingLocationSchema.shape.area.nullable(),
    // No defaults at this boundary: omission must never erase saved attributes.
    priceNegotiable: listingAttributeInputSchema.shape.priceNegotiable.removeDefault(),
    pricePeriod: listingAttributeInputSchema.shape.pricePeriod.removeDefault(),
    propertyDetails: listingAttributeInputSchema.shape.propertyDetails.removeDefault(),
    vehicleDetails: listingAttributeInputSchema.shape.vehicleDetails.removeDefault()
  })
  .superRefine((values, ctx) => {
    // A completely absent legacy location may be retained. The write boundary
    // checks the old row, so this cannot clear an already assigned location.
    if (values.district === null && values.area === null) return
    const location = listingLocationSchema.safeParse(values)
    if (!location.success) for (const issue of location.error.issues) ctx.addIssue({ ...issue })
  })

export const listingCorrectionSchema = listingCorrectionFieldsSchema.safeExtend({
  id: listingIdSchema,
  updatedAt: z.iso.datetime(),
  confirmAttributeRemoval: z.boolean()
})

export type ListingCorrectionFields = z.output<typeof listingCorrectionFieldsSchema>
export type ListingCorrectionListing = {
  id: string
  updatedAt: string
  status: ListingStatus
  price: string
  currency: ListingCurrency
  values: ListingCorrectionFields
}
export type ListingCorrectionResult =
  { success: true; message: string; changed: boolean } | { success: false; message: string; fieldErrors?: Record<string, string[]> }
