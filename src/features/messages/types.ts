export type ChatMessage = {
  id: string
  senderId: string
  content: string
  sequence: number
  createdAt: string
}

export type MessageHistory = { messages: ChatMessage[]; hasMore: boolean }

export type ConversationPreview = {
  id: string
  listingId: string | null
  listingTitle: string
  coverUrl: string | null
  otherName: string
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
}

export type ConversationDetails = {
  id: string
  userId: string
  listingId: string | null
  listingTitle: string
  listingAvailable: boolean
  coverUrl: string | null
  otherName: string
  canSend: boolean
  history: MessageHistory
}
