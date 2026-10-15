export type ChatMessage = {
  id: string
  senderId: string
  content: string
  sequence: number
  createdAt: string
}

export type MessageHistory = { messages: ChatMessage[]; hasMore: boolean; otherReadSequence: number }

export type ConversationPreview = {
  id: string
  listingId: string | null
  listingTitle: string
  otherName: string
  otherId: string
  otherAvatar: string | null
  lastMessage: string | null
  lastMessageOwn: boolean
  lastMessageAt: string
  unreadCount: number
}

export type ConversationDetails = {
  id: string
  userId: string
  listingId: string | null
  listingTitle: string
  listingAvailable: boolean
  otherName: string
  otherId: string
  otherAvatar: string | null
  canSend: boolean
  history: MessageHistory
}
