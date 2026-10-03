import { z } from 'zod'
import { listingIdSchema } from '@/entities/listing/schema'

export const conversationIdSchema = z.string().uuid()
const sequenceSchema = z.number().int().min(0).max(2147483647)
export const createConversationSchema = z.object({ listingId: listingIdSchema }).strict()
export const messageContentSchema = z.string().trim().min(1, 'Enter a message.').max(2000, 'Use at most 2000 characters.')
export const sendMessageSchema = z
  .object({ conversationId: conversationIdSchema, messageId: z.string().uuid(), content: messageContentSchema })
  .strict()
export const historySchema = z
  .object({
    conversationId: conversationIdSchema,
    before: sequenceSchema.positive().optional(),
    after: sequenceSchema.optional()
  })
  .strict()
  .refine((value) => value.before === undefined || value.after === undefined, 'Choose one history direction.')
export const readMessagesSchema = z.object({ conversationId: conversationIdSchema, throughSequence: sequenceSchema }).strict()

export const historyResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(false), message: z.string() }),
  z.object({
    success: z.literal(true),
    data: z.object({
      hasMore: z.boolean(),
      messages: z
        .array(
          z.object({
            id: z.string().uuid(),
            senderId: z.string(),
            content: z.string().max(2000),
            sequence: sequenceSchema.positive(),
            createdAt: z.iso.datetime()
          })
        )
        .max(50)
    })
  })
])
