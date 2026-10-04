'use server'

import { revalidatePath } from 'next/cache'
import type { ActionMessageResult } from '@/lib/action-result'
import { contactRequests } from './contact-server'
import { ContactRequestError } from './contact-workflow'

async function execute(work: () => Promise<string>, message: string): Promise<ActionMessageResult> {
  let id: string
  try {
    id = await work()
  } catch (error) {
    return {
      success: false,
      message: error instanceof ContactRequestError ? error.message : 'Could not save this contact request. Please try again.'
    }
  }
  try {
    revalidatePath('/moderator/contact')
    revalidatePath(`/moderator/contact/${id}`)
  } catch {
    return { success: true, message: `${message} Reload to see the update.` }
  }
  return { success: true, message }
}

export async function markContactViewed(id: unknown): Promise<ActionMessageResult> {
  return execute(() => contactRequests.markViewed(id), 'Contact request marked as viewed.')
}
export async function changeContactStatus(input: unknown): Promise<ActionMessageResult> {
  return execute(() => contactRequests.changeStatus(input), 'Contact request status updated.')
}
