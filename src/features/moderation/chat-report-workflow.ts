import 'server-only'
import { chatReportQueueSchema, createChatReportSchema, moderatorHistorySchema, resolveChatReportSchema } from '@/features/messages/report-schema'
import { conversationIdSchema } from '@/features/messages/schema'
import { participantWhere } from '@/features/messages/workflow'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { canUseMarketplace } from '@/lib/account-role'
import { hasActiveBan } from '@/lib/ban-status'
import { getPagination } from '@/lib/pagination'
import { canManageUserBan } from './ban-policy'
import { getModerationQuery } from './search'

export class ChatReportError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message)
  }
}

const identitySelect = { id: true, name: true, email: true } as const
const actorSelect = { id: true, role: true, banned: true, banExpires: true } as const
const reportedUserSelect = { ...identitySelect, ...actorSelect } as const
const conversationSelect = {
  id: true,
  listingId: true,
  listingTitle: true,
  listing: { select: { id: true, title: true, status: true } },
  buyer: { select: identitySelect },
  seller: { select: identitySelect }
} satisfies Prisma.ConversationSelect
const reportSelect = {
  id: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  reporter: { select: identitySelect },
  reportedUser: { select: reportedUserSelect },
  reviewedBy: { select: { id: true, name: true } },
  conversation: { select: conversationSelect }
} satisfies Prisma.ChatReportSelect

type Actor = { id: string; role?: string | null }
type Dependencies = {
  db: PrismaClient
  currentUserId: () => Promise<string | null>
  moderatorActor: () => Promise<Actor | null>
  limitReport: (id: string) => Promise<{ success: true } | { success: false; message: string; status: number }>
}

// Uses the existing feature-local injection pattern to test RBAC without live services.
export function createChatReportOperations({ db, currentUserId, moderatorActor, limitReport }: Dependencies) {
  async function moderator() {
    const actor = await moderatorActor()
    if (!actor || (actor.role !== 'moderator' && actor.role !== 'admin')) throw new ChatReportError('Moderator access is required.', 403)
    return actor
  }

  async function createReport(input: unknown) {
    const parsed = createChatReportSchema.safeParse(input)
    if (!parsed.success) throw new ChatReportError(parsed.error.issues[0]?.message ?? 'Invalid report.')
    const reporterId = await currentUserId()
    if (!reporterId) throw new ChatReportError('Sign in to report a user.', 401)
    const limit = await limitReport(reporterId)
    if (!limit.success) throw new ChatReportError(limit.message, limit.status)
    return db.$transaction(async (tx) => {
      // Serializes concurrent reports by this user, and rechecks role/ban after the lock.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${reporterId} FOR NO KEY UPDATE`
      const actor = await tx.user.findUnique({ where: { id: reporterId }, select: actorSelect })
      if (!actor || hasActiveBan(actor) || !canUseMarketplace(actor.role)) throw new ChatReportError('This account cannot submit chat reports.', 403)
      const conversation = await tx.conversation.findFirst({
        where: { id: parsed.data.conversationId, ...participantWhere(reporterId) },
        select: { id: true, buyerId: true, sellerId: true }
      })
      if (!conversation) throw new ChatReportError('Conversation not found or unavailable.', 404)
      const reportedUserId = conversation.buyerId === reporterId ? conversation.sellerId : conversation.buyerId
      if (reportedUserId === reporterId) throw new ChatReportError('You cannot report yourself.')
      const where = { conversationId: conversation.id, reporterId, reportedUserId, status: 'OPEN' as const }
      const existing = await tx.chatReport.findFirst({ where, select: { id: true } })
      if (existing) return { id: existing.id, duplicate: true }
      const report = await tx.chatReport.create({
        data: { ...where, reason: parsed.data.reason, details: parsed.data.details || null },
        select: { id: true }
      })
      return { id: report.id, duplicate: false }
    })
  }

  async function getReports(input: unknown) {
    await moderator()
    const parsed = chatReportQueueSchema.safeParse(input)
    const params = parsed.success ? parsed.data : { status: 'OPEN' as const, page: undefined }
    const where = params.status === 'ALL' ? {} : { status: params.status }
    const totalItems = await db.chatReport.count({ where })
    const pagination = getPagination({ pageParam: params.page, totalItems })
    const reports = await db.chatReport.findMany({
      where,
      select: reportSelect,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      skip: pagination.skip,
      take: pagination.take
    })
    return { reports, status: params.status, ...pagination }
  }

  async function getReport(id: unknown) {
    const actor = await moderator()
    const parsed = conversationIdSchema.safeParse(id)
    if (!parsed.success) return null
    const report = await db.chatReport.findUnique({ where: { id: parsed.data }, select: reportSelect })
    return report ? { ...report, canManageBan: canManageUserBan(actor, report.reportedUser) } : null
  }

  async function getConversation(id: unknown) {
    await moderator()
    const parsed = conversationIdSchema.safeParse(id)
    return parsed.success ? db.conversation.findUnique({ where: { id: parsed.data }, select: conversationSelect }) : null
  }

  async function getHistory(input: unknown) {
    await moderator()
    const parsed = moderatorHistorySchema.safeParse(input)
    if (!parsed.success) throw new ChatReportError('Invalid message history request.')
    const { conversationId, before } = parsed.data
    const rows = await db.message.findMany({
      where: { conversationId, ...(before === undefined ? {} : { sequence: { lt: before } }) },
      select: { id: true, content: true, sequence: true, createdAt: true, sender: { select: { id: true, name: true } } },
      orderBy: { sequence: 'desc' },
      take: 51
    })
    const messages = rows.slice(0, 50).reverse()
    return { messages, hasMore: rows.length > 50, nextBefore: messages[0]?.sequence }
  }

  async function resolveReport(input: unknown) {
    const actor = await moderator()
    const parsed = resolveChatReportSchema.safeParse(input)
    if (!parsed.success) throw new ChatReportError('Invalid report.')
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR NO KEY UPDATE`
      const freshActor = await tx.user.findUnique({ where: { id: actor.id }, select: actorSelect })
      if (!freshActor || hasActiveBan(freshActor) || (freshActor.role !== 'moderator' && freshActor.role !== 'admin')) {
        throw new ChatReportError('Moderator access is required.', 403)
      }
      const updated = await tx.chatReport.updateMany({
        where: { id: parsed.data.reportId, status: 'OPEN' },
        data: { status: 'RESOLVED', reviewedAt: new Date(), reviewedById: actor.id }
      })
      if (!updated.count) throw new ChatReportError('Report is unavailable or has already been resolved.', 409)
      return { id: parsed.data.reportId }
    })
  }

  async function searchConversations(query?: string | string[], pageParam?: string | string[]) {
    await moderator()
    const q = getModerationQuery(query)
    // No unfiltered personal-chat feed; lookup requires an explicit support query.
    if (!q) return { conversations: [], query: q, ...getPagination({ totalItems: 0 }) }
    const contains = { contains: q, mode: 'insensitive' } as const
    const where: Prisma.ConversationWhereInput = {
      OR: [
        { id: contains },
        { listingId: contains },
        { listingTitle: contains },
        { listing: { is: { title: contains } } },
        { buyer: { is: { OR: [{ name: contains }, { email: contains }] } } },
        { seller: { is: { OR: [{ name: contains }, { email: contains }] } } }
      ]
    }
    const totalItems = await db.conversation.count({ where })
    const pagination = getPagination({ pageParam, totalItems })
    const conversations = await db.conversation.findMany({
      where,
      select: conversationSelect,
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      skip: pagination.skip,
      take: pagination.take
    })
    return { conversations, query: q, ...pagination }
  }

  return { createReport, getReports, getReport, getConversation, getHistory, resolveReport, searchConversations }
}
