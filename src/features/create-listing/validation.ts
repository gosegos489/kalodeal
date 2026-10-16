import type { z } from 'zod'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { createCategoryAttributesSchema } from '@/features/listing-attributes/schema'
import type { ListingDetailsValues } from './types'

export function listingFieldErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root'
    const messages = errors[path] ?? []
    messages.push(issue.message)
    errors[path] = messages
  }
  return errors
}

// Legacy rentals may retain an unknown period while price/category are untouched.
// New rentals and edits to price/category must choose a valid period when priced.
export function getAttributeValidationPrice(
  values: ListingDetailsValues,
  previous?: Pick<ListingDetailsValues, 'pricePeriod' | 'categoryId' | 'price'>
) {
  // Inputs come from the common schema/DB projection. Equivalent decimal
  // formatting must not force a legacy rental-period edit.
  const samePrice =
    previous && (previous.price === values.price || (previous.price !== '' && values.price !== '' && Number(previous.price) === Number(values.price)))
  const retainLegacyPeriod = previous?.pricePeriod === null && values.pricePeriod === null && previous.categoryId === values.categoryId && samePrice
  return retainLegacyPeriod ? '' : values.price
}

export function validateListingCategoryAttributes(
  categorySlug: string,
  values: ListingDetailsValues,
  previous?: Pick<ListingDetailsValues, 'pricePeriod' | 'categoryId' | 'price'>
) {
  return createCategoryAttributesSchema(getCategoryAttributeProfile(categorySlug), getAttributeValidationPrice(values, previous)).safeParse({
    priceNegotiable: values.priceNegotiable,
    pricePeriod: values.pricePeriod,
    propertyDetails: values.propertyDetails,
    vehicleDetails: values.vehicleDetails
  })
}
