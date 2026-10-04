import z from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'
import { moderationMessageSchema } from '@/features/account/settings/schema'
import { listingDetailsSchema } from '@/features/create-listing/schema'

export const listingModerationReasons = [
  { value: 'wrong-category', label: 'Wrong category' },
  { value: 'inappropriate-title', label: 'Inappropriate title' },
  { value: 'inappropriate-description', label: 'Inappropriate description' },
  { value: 'inappropriate-image', label: 'Inappropriate image' },
  { value: 'advertising-links', label: 'Advertising / links' },
  { value: 'contact-information', label: 'Contact information' },
  { value: 'misleading-information', label: 'Misleading information' },
  { value: 'other', label: 'Other' }
] as const

const reference = { id: listingIdSchema, updatedAt: z.iso.datetime() }
const reason = z.enum(listingModerationReasons.map(({ value }) => value)).optional()

export const listingModerationSchema = z.discriminatedUnion('decision', [
  z.object({ ...reference, decision: z.literal('approve') }).strict(),
  z.object({ ...reference, decision: z.literal('request-changes'), reason, message: moderationMessageSchema }).strict(),
  z.object({ ...reference, decision: z.literal('hide'), reason, message: moderationMessageSchema }).strict(),
  z.object({ ...reference, decision: z.literal('reject'), reason, message: z.string().trim().max(500).optional() }).strict(),
  z.object({ ...reference, decision: z.literal('change-category'), categoryId: listingDetailsSchema.shape.categoryId }).strict()
])
