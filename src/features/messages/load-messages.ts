import type { ActionResult } from '@/lib/action-result'
import { historyResultSchema, historySchema } from './schema'
import type { MessageHistory } from './types'

export async function loadConversationMessages(input: unknown, signal?: AbortSignal): Promise<ActionResult<MessageHistory>> {
  const parsed = historySchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid history request.' }
  const { conversationId, before, after } = parsed.data
  const query = new URLSearchParams()
  if (before !== undefined) query.set('before', String(before))
  if (after !== undefined) query.set('after', String(after))
  const response = await fetch(`/api/messages/${conversationId}?${query}`, { cache: 'no-store', credentials: 'same-origin', signal })
  const result = historyResultSchema.safeParse(await response.json())
  return result.success ? result.data : { success: false, message: 'Could not load messages. Please try again.' }
}
