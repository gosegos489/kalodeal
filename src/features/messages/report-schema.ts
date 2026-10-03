import { z } from 'zod'
import { ChatReportReason, ChatReportStatus } from '@/generated/prisma/enums'
import { conversationIdSchema } from './schema'

export const reportReasons = [
  { value: ChatReportReason.HARASSMENT, label: 'Threats or harassment' },
  { value: ChatReportReason.SPAM, label: 'Spam' },
  { value: ChatReportReason.FRAUD, label: 'Scam / fraud' },
  { value: ChatReportReason.OFFENSIVE, label: 'Offensive content' },
  { value: ChatReportReason.OTHER, label: 'Other' }
]

export const createChatReportSchema = z
  .object({
    conversationId: conversationIdSchema,
    reason: z.enum(ChatReportReason),
    details: z.string().trim().max(500, 'Use at most 500 characters.').optional()
  })
  .strict()

export const resolveChatReportSchema = z.object({ reportId: z.string().uuid() }).strict()
export const chatReportQueueSchema = z.object({
  status: z.enum(ChatReportStatus).or(z.literal('ALL')).default('OPEN'),
  page: z.string().optional()
})

export const moderatorHistorySchema = z
  .object({
    conversationId: conversationIdSchema,
    before: z
      .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
      .pipe(z.number().int().positive().max(2147483647))
      .optional()
  })
  .strict()

export function getReportReasonLabel(reason: ChatReportReason) {
  return reportReasons.find((option) => option.value === reason)?.label ?? reason
}
