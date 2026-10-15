import type { ChatMessage } from './types'

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  return [...new Map([...current, ...incoming].map((message) => [message.id, message])).values()].sort((a, b) => a.sequence - b.sequence)
}

// A send response may arrive before intervening incoming messages are fetched.
export function renderedReadSequence(messages: ChatMessage[], reconciledThrough: number) {
  return Math.min(messages.at(-1)?.sequence ?? 0, reconciledThrough)
}
