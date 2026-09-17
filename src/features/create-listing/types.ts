import type z from 'zod'
import type { listingDetailsSchema } from './schema'

export type CreateListingInput = z.input<typeof listingDetailsSchema>
export type CreateListingValues = z.output<typeof listingDetailsSchema>
export type ListingCategoryOption = { id: string; name: string }

export type CreateListingResult =
  { success: true; data: { id: string } } | { success: false; message: string; fieldErrors?: Partial<Record<keyof CreateListingValues, string[]>> }
