import type { CreateListingResult, ListingDetailsValues } from '@/features/create-listing/types'
import type { ListingStatus } from '@/generated/prisma/enums'
import type { ListingPhotoState } from './photo-schema'

export type EditableListing = ListingPhotoState & {
  id: string
  values: ListingDetailsValues
}

export type UpdateListingResult =
  { success: true; data: { id: string; status: ListingStatus; changed: boolean } } | Extract<CreateListingResult, { success: false }>
