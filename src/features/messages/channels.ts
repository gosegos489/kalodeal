export function conversationChannel(id: string) {
  return `chat:conversation:${id}`
}

export function inboxChannel(userId: string) {
  return `chat:messages:user:${encodeURIComponent(userId).replace(/\*/g, '%2A')}`
}
