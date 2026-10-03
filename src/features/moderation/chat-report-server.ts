import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { checkChatReportRateLimit } from '@/lib/rate-limit'
import { createChatReportOperations } from './chat-report-workflow'

export const chatReports = createChatReportOperations({
  db: prisma,
  currentUserId: async () => (await getMutationSession())?.user.id ?? null,
  moderatorActor: async () => (await getMutationSession())?.user ?? null,
  limitReport: checkChatReportRateLimit
})
