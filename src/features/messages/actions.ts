'use server'

import { revalidatePath } from 'next/cache'
import 'server-only'
import type { ActionResult } from '@/lib/action-result'
import { captureServerException } from '@/lib/sentry-server'
import { messaging } from './server'
import { MessagingError } from './workflow'

async function result<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await operation() }
  } catch (error) {
    if (!(error instanceof MessagingError)) await captureServerException(error, { feature: 'messages', operation: 'mutation' })
    return { success: false, message: error instanceof MessagingError ? error.message : 'Could not complete this request. Please try again.' }
  }
}

export async function openListingConversation(input: unknown) {
  const response = await result(() => messaging.createConversation(input))
  if (response.success) revalidatePath('/account/messages', 'layout')
  return response
}

export async function sendConversationMessage(input: unknown) {
  return result(() => messaging.sendMessage(input))
}

export async function markConversationRead(input: unknown) {
  return result(() => messaging.markRead(input))
}
