'use server'

import { revalidatePath } from 'next/cache'
import 'server-only'
import type { ActionMessageResult } from '@/lib/action-result'
import { captureServerException } from '@/lib/sentry-server'
import { chatReports } from './chat-report-server'
import { ChatReportError } from './chat-report-workflow'

async function execute(work: () => Promise<string>): Promise<ActionMessageResult> {
  let message: string
  try {
    message = await work()
  } catch (error) {
    if (!(error instanceof ChatReportError)) await captureServerException(error, { feature: 'chat-reports', operation: 'mutation' })
    return { success: false, message: error instanceof ChatReportError ? error.message : 'Could not save this report. Please try again.' }
  }
  try {
    revalidatePath('/moderator', 'layout')
  } catch {
    return { success: true, message: `${message} Reload to see the updated queue.` }
  }
  return { success: true, message }
}

export async function reportConversationUser(input: unknown): Promise<ActionMessageResult> {
  return execute(async () => {
    const report = await chatReports.createReport(input)
    return report.duplicate
      ? 'You already have an open report for this conversation.'
      : 'Report submitted. A moderator will review this conversation.'
  })
}

export async function resolveChatReport(input: unknown): Promise<ActionMessageResult> {
  return execute(async () => {
    await chatReports.resolveReport(input)
    return 'Report resolved.'
  })
}
