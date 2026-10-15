export function conversationChannel(id: string) {
  return `chat:conversation:${id}`
}

export function inboxChannel(userId: string) {
  return `chat:messages:user:${encodeURIComponent(userId).replace(/\*/g, '%2A')}`
}

export function presenceChannel(userId: string) {
  return `chat:presence:user:${encodeURIComponent(userId).replace(/\*/g, '%2A')}`
}
