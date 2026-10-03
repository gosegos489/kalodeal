'use client'

import type { ListingPlan } from '@/lib/plan-limits'
import { ListingForm } from './listing-form'
import type { ListingCategoryOption } from './types'

type CreateListingFormProps = {
  categories: ListingCategoryOption[]
  plan: ListingPlan
  listingSlotCount: number
}

export default function CreateListingForm(props: CreateListingFormProps) {
  return <ListingForm mode="create" {...props} />
}
