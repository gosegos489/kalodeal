import { z } from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'

export const favoriteMutationSchema = z.object({ listingId: listingIdSchema, isFavorited: z.boolean() }).strict()
