import z from 'zod'
import { listingImageSchema } from '@/features/create-listing/schema'
import { ListingStatus, SubscriptionPlan } from '@/generated/prisma/enums'
import { PLAN_LIMITS } from '@/lib/plan-limits'

const imageIdSchema = z.string().cuid()
const reference = { updatedAt: z.iso.datetime() }

export const photoMutationSchema = z.discriminatedUnion('operation', [
  z.object({ ...reference, operation: z.literal('add'), images: z.array(listingImageSchema).min(1).max(PLAN_LIMITS.PRO.imagesPerListing) }).strict(),
  z.object({ ...reference, operation: z.literal('replace'), imageId: imageIdSchema, images: z.tuple([listingImageSchema]) }).strict(),
  z.object({ ...reference, operation: z.literal('delete'), imageId: imageIdSchema }).strict(),
  z.object({ ...reference, operation: z.literal('reorder'), imageIds: z.array(imageIdSchema).min(1).max(PLAN_LIMITS.PRO.imagesPerListing) }).strict()
])

export const listingPhotoStateSchema = z.object({
  updatedAt: z.iso.datetime(),
  status: z.enum(ListingStatus),
  plan: z.enum(SubscriptionPlan),
  images: z.array(z.object({ id: imageIdSchema, url: z.url().nullable(), sortOrder: z.number().int().nonnegative() }))
})

export const photoMutationResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: listingPhotoStateSchema, warning: z.string().optional() }),
  z.object({ success: z.literal(false), message: z.string() })
])

export type PhotoMutation = z.infer<typeof photoMutationSchema>
export type ListingPhotoState = z.infer<typeof listingPhotoStateSchema>
export type PhotoMutationResult = z.infer<typeof photoMutationResultSchema>
