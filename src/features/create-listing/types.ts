import type z from 'zod'
import type { createListingSchema } from './schema'

export type CreateListingInput = z.input<ReturnType<typeof createListingSchema>>
export type CreateListingValues = z.output<ReturnType<typeof createListingSchema>>
export type ListingCategoryOption = { id: string; name: string }

export type CreateListingResult =
  { success: true; data: { id: string } } | { success: false; message: string; fieldErrors?: Partial<Record<keyof CreateListingValues, string[]>> }
