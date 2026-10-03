import z from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'

export const listingModerationSchema = z
  .object({
    id: listingIdSchema,
    updatedAt: z.iso.datetime(),
    decision: z.enum(['approve', 'reject'])
  })
  .strict()
