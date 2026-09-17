import z from 'zod'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const listingImageSchema = z
  .file('Choose an image file.')
  .min(1, 'Choose a non-empty image file.')
  .max(MAX_IMAGE_BYTES, 'Each image must be no larger than 5 MB.')
  .mime([...IMAGE_TYPES], 'Use a JPEG, PNG or WebP image.')

export function createListingSchema(plan: ListingPlan = 'FREE') {
  const maxImages = PLAN_LIMITS[plan].imagesPerListing

  return z.object({
    images: z.array(listingImageSchema).max(maxImages, `Add no more than ${maxImages} images.`).default([]),
    title: z.string().trim().min(5, 'Use at least 5 characters.').max(120, 'Use no more than 120 characters.'),
    categoryId: z.string().min(1, 'Choose a category.').max(100),
    description: z.string().trim().min(20, 'Add at least 20 characters about your listing.').max(3000, 'Use no more than 3000 characters.'),
    price: z
      .string()
      .trim()
      .refine((value) => value === '' || /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value), 'Enter a valid price with up to 2 decimal places.'),
    phone: z
      .string()
      .trim()
      .min(7, 'Enter a phone number.')
      .max(30)
      .refine(
        (value) => /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15,
        'Enter a valid phone number.'
      ),
    youtube: z
      .string()
      .trim()
      .max(500)
      .refine((value) => {
        if (!value) return true
        try {
          const url = new URL(value)
          return (
            url.protocol === 'https:' &&
            ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname) &&
            !url.username &&
            !url.password
          )
        } catch {
          return false
        }
      }, 'Enter an HTTPS YouTube link.')
  })
}

export const listingDetailsSchema = createListingSchema()
