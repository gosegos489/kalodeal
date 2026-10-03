import type { CreateListingResult, ListingDetailsValues } from '@/features/create-listing/types'
import type { ListingStatus } from '@/generated/prisma/enums'

export type EditableListing = {
  id: string
  updatedAt: string
  status: ListingStatus
  values: ListingDetailsValues
  images: { id: string; url: string }[]
}

export type UpdateListingResult =
  { success: true; data: { id: string; status: ListingStatus; changed: boolean } } | Extract<CreateListingResult, { success: false }>
