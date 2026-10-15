import 'server-only'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { publishMessagingUpdate } from '@/lib/ably'
import { getSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { checkConversationCreateRateLimit, checkMessageSendRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import type { ConversationDetails, ConversationPreview } from './types'
import { createMessagingOperations } from './workflow'

export const messaging = createMessagingOperations({
  db: prisma,
  currentUserId: async () => (await getSession(true))?.user.id ?? null,
  limitSend: checkMessageSendRateLimit,
  limitCreate: checkConversationCreateRateLimit,
  publish: async (channels) => {
    try {
      await publishMessagingUpdate(channels)
    } catch (error) {
      // workflow.notify catches this rethrow and returns false, so global error tracking never sees it.
      await captureServerException(error, { feature: 'messages', operation: 'realtime-publish' })
      throw error
    }
  }
})

export async function getMyConversations(pageParam?: string | string[]) {
  const { viewer, rows, unread, ...pagination } = await messaging.getConversations(pageParam)
  const counts = new Map(unread.map((row) => [row.conversationId, row._count._all]))
  const conversations: ConversationPreview[] = rows.map((row) => ({
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listing?.title ?? row.listingTitle,
    otherName: getSellerName(row.buyerId === viewer ? row.seller.name : row.buyer.name),
    otherId: row.buyerId === viewer ? row.sellerId : row.buyerId,
    otherAvatar: getApprovedAvatarUrl(
      row.buyerId === viewer ? row.sellerId : row.buyerId,
      row.buyerId === viewer ? row.seller.image : row.buyer.image
    ),
    lastMessage: row.messages[0]?.content ?? null,
    lastMessageOwn: row.messages[0]?.senderId === viewer,
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
    otherName: getSellerName(row.buyerId === viewer ? row.seller.name : row.buyer.name),
    otherId: row.buyerId === viewer ? row.sellerId : row.buyerId,
    otherAvatar: getApprovedAvatarUrl(
      row.buyerId === viewer ? row.sellerId : row.buyerId,
      row.buyerId === viewer ? row.seller.image : row.buyer.image
    ),
    canSend,
    history
  }
}
