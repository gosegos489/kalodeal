import type z from 'zod'
import type { createListingSchema, listingDetailsSchema } from './schema'

export type CreateListingInput = z.input<ReturnType<typeof createListingSchema>>
export type CreateListingValues = z.output<ReturnType<typeof createListingSchema>>
export type ListingDetailsValues = z.infer<typeof listingDetailsSchema>
export type ListingCategoryOption = { id: string; name: string }

export type CreateListingResult =
  { success: true; data: { id: string } } | { success: false; message: string; fieldErrors?: Partial<Record<keyof CreateListingValues, string[]>> }
