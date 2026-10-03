import { randomUUID } from 'node:crypto'
import 'server-only'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { canUseMarketplace } from '@/lib/account-role'
import { getPagination } from '@/lib/pagination'
import { conversationChannel, inboxChannel } from './channels'
import { conversationIdSchema, createConversationSchema, historySchema, readMessagesSchema, sendMessageSchema } from './schema'
import type { ChatMessage, MessageHistory } from './types'

export class MessagingError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message)
  }
}

export function isMessagingBanned(user: { banned: boolean | null; banExpires: Date | null }) {
  return !!user.banned && (!user.banExpires || user.banExpires.getTime() > Date.now())
}

export function participantWhere(userId: string) {
  return { OR: [{ buyerId: userId }, { sellerId: userId }] }
}

const participantSelect = { id: true, buyerId: true, sellerId: true, lastSequence: true, buyerReadSequence: true, sellerReadSequence: true } as const
const messageSelect = { id: true, senderId: true, content: true, sequence: true, createdAt: true } as const
const previewBaseSelect = {
  ...participantSelect,
  listingId: true,
  listingTitle: true,
  lastMessageAt: true
} as const
const previewSelect = {
  ...previewBaseSelect,
  buyer: { select: { name: true } },
  seller: { select: { name: true } },
  listing: {
    select: {
      title: true,
      status: true,
      images: { select: { key: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 1 }
    }
  },
  messages: { select: { content: true }, orderBy: { sequence: 'desc' }, take: 1 }
} satisfies Prisma.ConversationSelect

type RateCheck = (userId: string) => Promise<{ success: true } | { success: false; message: string; status: number }>
type Dependencies = {
  db: PrismaClient
  currentUserId: () => Promise<string | null>
  limitSend: RateCheck
  limitCreate: RateCheck
  publish: (channels: string[]) => Promise<void>
}

function serializeMessage(message: Omit<ChatMessage, 'createdAt'> & { createdAt: Date }): ChatMessage {
  return { ...message, createdAt: message.createdAt.toISOString() }
}

// Feature-local dependency injection keeps authorization/write ordering testable without live services.
export function createMessagingOperations({ db, currentUserId, limitSend, limitCreate, publish }: Dependencies) {
  async function userId() {
    const id = await currentUserId()
    if (!id) throw new MessagingError('Sign in to access messages.', 401)
    const actor = await db.user.findUnique({ where: { id }, select: { role: true } })
    if (!actor || !canUseMarketplace(actor.role)) throw new MessagingError('Moderator accounts use chat reports in the moderator panel.', 403)
    return id
  }

  async function participant(tx: Prisma.TransactionClient, id: string, viewer: string) {
    const conversation = await tx.conversation.findFirst({ where: { id, ...participantWhere(viewer) }, select: participantSelect })
    if (!conversation) throw new MessagingError('Conversation not found or unavailable.', 404)
    return conversation
  }

  async function writableUser(tx: Prisma.TransactionClient, viewer: string) {
    // Cooperates with ban updates and prevents a stale cookie cache from authorizing a send.
    // A non-key lock still serializes ban changes, while allowing participant foreign-key checks.
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${viewer} FOR NO KEY UPDATE`
    const user = await tx.user.findUnique({ where: { id: viewer }, select: { role: true, banned: true, banExpires: true } })
    if (!user) throw new MessagingError('Sign in to access messages.', 401)
    if (!canUseMarketplace(user.role)) throw new MessagingError('Moderator accounts cannot participate in marketplace chats.', 403)
    if (isMessagingBanned(user)) throw new MessagingError('Your account is banned. You cannot send messages.', 403)
  }

  async function notify(channels: string[]) {
    try {
      await publish(channels)
      return true
    } catch {
      // A delivery outage must never turn a committed database write into a failed send.
      return false
    }
  }

  async function createConversation(input: unknown) {
    const parsed = createConversationSchema.safeParse(input)
    if (!parsed.success) throw new MessagingError('Invalid listing.')
    const viewer = await userId()
    const limit = await limitCreate(viewer)
    if (!limit.success) throw new MessagingError(limit.message, limit.status)

    const conversation = await db.$transaction(async (tx) => {
      await writableUser(tx, viewer)
      const candidate = await tx.listing.findFirst({
        where: { id: parsed.data.listingId, status: 'ACTIVE' },
        select: { id: true, userId: true, title: true }
      })
      if (!candidate) throw new MessagingError('This listing is no longer available.', 404)
      if (candidate.userId === viewer) throw new MessagingError('You cannot message yourself.')
      // Match owner mutations' user -> listing lock order before checking visibility again.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${candidate.userId} FOR KEY SHARE`
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${candidate.id} FOR SHARE`
      const listing = await tx.listing.findFirst({
        where: { id: candidate.id, userId: candidate.userId, status: 'ACTIVE' },
        select: { id: true, userId: true, title: true }
      })
      if (!listing) throw new MessagingError('This listing is no longer available.', 404)
      const where = { buyerId: viewer, sellerId: listing.userId, listingId: listing.id }
      // ON CONFLICT plus the database unique constraint handles simultaneous clicks/tabs.
      await tx.conversation.createMany({ data: [{ id: randomUUID(), ...where, listingTitle: listing.title }], skipDuplicates: true })
      const result = await tx.conversation.findFirst({ where, select: { id: true, buyerId: true, sellerId: true } })
      if (!result) throw new Error('Conversation creation failed')
      return result
    })
    await notify([inboxChannel(conversation.buyerId), inboxChannel(conversation.sellerId)])
    return { conversationId: conversation.id }
  }

  async function sendMessage(input: unknown) {
    const parsed = sendMessageSchema.safeParse(input)
    if (!parsed.success) throw new MessagingError(parsed.error.issues[0]?.message ?? 'Invalid message.')
    const { conversationId, messageId, content } = parsed.data
    const viewer = await userId()
    await participant(db, conversationId, viewer)
    const limit = await limitSend(viewer)
    if (!limit.success) throw new MessagingError(limit.message, limit.status)

    const saved = await db.$transaction(async (tx) => {
      await writableUser(tx, viewer)
      await tx.$queryRaw`SELECT id FROM conversation WHERE id = ${conversationId} FOR UPDATE`
      const conversation = await participant(tx, conversationId, viewer)
      // Retrying a lost HTTP response uses the same message UUID and cannot duplicate the message.
      const existing = await tx.message.findFirst({ where: { id: messageId, conversationId, senderId: viewer }, select: messageSelect })
      if (existing && existing.content !== content) {
        throw new MessagingError('Invalid message retry.', 409)
      }
      if (existing) return { conversation, message: existing }
      const now = new Date()
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: { lastSequence: { increment: 1 }, lastMessageAt: now },
        select: { lastSequence: true }
      })
      const message = await tx.message.create({
        data: { id: messageId, conversationId, senderId: viewer, content, sequence: updated.lastSequence, createdAt: now },
        select: messageSelect
      })
      return { conversation, message }
    })
    const realtimeDelivered = await notify([
      conversationChannel(conversationId),
      inboxChannel(saved.conversation.buyerId),
      inboxChannel(saved.conversation.sellerId)
    ])
    return { message: serializeMessage(saved.message), realtimeDelivered }
  }

  async function getHistory(input: unknown): Promise<MessageHistory> {
    const parsed = historySchema.safeParse(input)
    if (!parsed.success) throw new MessagingError('Invalid message history request.')
    const viewer = await userId()
    const { conversationId, before, after } = parsed.data
    return db.$transaction(async (tx) => {
      await participant(tx, conversationId, viewer)
      const rows = await tx.message.findMany({
        where: { conversationId, ...(before !== undefined ? { sequence: { lt: before } } : after !== undefined ? { sequence: { gt: after } } : {}) },
        orderBy: { sequence: after !== undefined ? 'asc' : 'desc' },
        take: 51,
        select: messageSelect
      })
      const messages = rows.slice(0, 50)
      return { messages: (after === undefined ? messages.reverse() : messages).map(serializeMessage), hasMore: rows.length > 50 }
    })
  }

  async function markRead(input: unknown) {
    const parsed = readMessagesSchema.safeParse(input)
    if (!parsed.success) throw new MessagingError('Invalid read request.')
    const viewer = await userId()
    const result = await db.$transaction(async (tx) => {
      const conversation = await participant(tx, parsed.data.conversationId, viewer)
      const through = Math.min(parsed.data.throughSequence, conversation.lastSequence)
      const field = conversation.buyerId === viewer ? 'buyerReadSequence' : 'sellerReadSequence'
      const updated = await tx.conversation.updateMany({
        where: { id: conversation.id, ...participantWhere(viewer), [field]: { lt: through } },
        data: { [field]: through }
      })
      return { changed: updated.count > 0 }
    })
    if (result.changed) await notify([inboxChannel(viewer)])
    return result
  }

  async function getConversations(pageParam?: string | string[]) {
    const viewer = await userId()
    return db.$transaction(
      async (tx) => {
        const where = participantWhere(viewer)
        const totalItems = await tx.conversation.count({ where })
        const pagination = getPagination({ pageParam, totalItems })
        // Prisma fans out sibling relation reads internally. Keep one relation per
        // query and await each batch on this transaction's single pg connection.
        const page = await tx.conversation.findMany({
          where,
          select: { ...previewBaseSelect, messages: previewSelect.messages },
          orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
          skip: pagination.skip,
          take: pagination.take
        })
        const users = page.length
          ? await tx.user.findMany({
              where: { id: { in: [...new Set(page.flatMap((row) => [row.buyerId, row.sellerId]))] } },
              select: { id: true, name: true }
            })
          : []
        const listingIds = page.flatMap((row) => (row.listingId ? [row.listingId] : []))
        const listings = listingIds.length
          ? await tx.listing.findMany({
              where: { id: { in: [...new Set(listingIds)] } },
              select: { id: true, ...previewSelect.listing.select }
            })
          : []
        const usersById = new Map(users.map((user) => [user.id, user]))
        const listingsById = new Map(listings.map(({ id, ...listing }) => [id, listing]))
        const rows = page.map((row) => {
          const buyer = usersById.get(row.buyerId)
          const seller = usersById.get(row.sellerId)
          if (!buyer || !seller) throw new Error('Conversation participant not found')
          return {
            ...row,
            buyer: { name: buyer.name },
            seller: { name: seller.name },
            listing: row.listingId ? (listingsById.get(row.listingId) ?? null) : null
          }
        })
        const unread = rows.length
          ? await tx.message.groupBy({
              by: ['conversationId'],
              where: {
                senderId: { not: viewer },
                OR: rows.map((row) => ({
                  conversationId: row.id,
                  sequence: { gt: row.buyerId === viewer ? row.buyerReadSequence : row.sellerReadSequence }
                }))
              },
              _count: { _all: true }
            })
          : []
        return { viewer, rows, unread, ...pagination }
      },
      { isolationLevel: 'RepeatableRead' }
    )
  }

  async function getConversation(id: unknown) {
    const parsed = conversationIdSchema.safeParse(id)
    if (!parsed.success) throw new MessagingError('Conversation not found or unavailable.', 404)
    const viewer = await userId()
    const row = await db.conversation.findFirst({ where: { id: parsed.data, ...participantWhere(viewer) }, select: previewSelect })
    if (!row) throw new MessagingError('Conversation not found or unavailable.', 404)
    const actor = await db.user.findUnique({ where: { id: viewer }, select: { banned: true, banExpires: true } })
    return { viewer, row, canSend: !!actor && !isMessagingBanned(actor), history: await getHistory({ conversationId: row.id }) }
  }

  async function getChannels(id?: unknown) {
    const viewer = await userId()
    const channels = [inboxChannel(viewer)]
    if (id !== undefined) {
      const parsed = conversationIdSchema.safeParse(id)
      if (!parsed.success) throw new MessagingError('Invalid conversation.')
      await participant(db, parsed.data, viewer)
      channels.push(conversationChannel(parsed.data))
    }
    return { viewer, channels }
  }

  return { createConversation, sendMessage, getHistory, markRead, getConversations, getConversation, getChannels }
}
