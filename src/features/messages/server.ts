import 'server-only'
import { getListingImageUrl } from '@/entities/listing/listing-summary'
import { getSellerName } from '@/entities/user/public-profile'
import { publishMessagingUpdate } from '@/lib/ably'
import { getSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { checkConversationCreateRateLimit, checkMessageSendRateLimit } from '@/lib/rate-limit'
import type { ConversationDetails, ConversationPreview } from './types'
import { createMessagingOperations } from './workflow'

export const messaging = createMessagingOperations({
  db: prisma,
  currentUserId: async () => (await getSession(true))?.user.id ?? null,
  limitSend: checkMessageSendRateLimit,
  limitCreate: checkConversationCreateRateLimit,
  publish: publishMessagingUpdate
})

export async function getMyConversations(pageParam?: string | string[]) {
  const { viewer, rows, unread, ...pagination } = await messaging.getConversations(pageParam)
  const counts = new Map(unread.map((row) => [row.conversationId, row._count._all]))
  const conversations: ConversationPreview[] = rows.map((row) => ({
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listing?.title ?? row.listingTitle,
    coverUrl: getListingImageUrl(row.listing?.images[0]?.key),
    otherName: getSellerName(row.buyerId === viewer ? row.seller.name : row.buyer.name),
    lastMessage: row.messages[0]?.content ?? null,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unreadCount: counts.get(row.id) ?? 0
  }))
  return { userId: viewer, conversations, ...pagination }
}

export async function getMyConversation(id: unknown): Promise<ConversationDetails> {
  const { viewer, row, canSend, history } = await messaging.getConversation(id)
  return {
    id: row.id,
    userId: viewer,
    listingId: row.listingId,
    listingTitle: row.listing?.title ?? row.listingTitle,
    listingAvailable: row.listing?.status === 'ACTIVE',
    coverUrl: getListingImageUrl(row.listing?.images[0]?.key),
    otherName: getSellerName(row.buyerId === viewer ? row.seller.name : row.buyer.name),
    canSend,
    history
  }
}
