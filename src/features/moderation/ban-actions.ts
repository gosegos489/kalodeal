'use server'

import { APIError } from 'better-auth/api'
import { revalidatePath } from 'next/cache'
import 'server-only'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getSettingsActor } from '@/features/account/settings/server'
import type { ActionMessageResult } from '@/lib/action-result'
import { auth } from '@/lib/auth'
import { getAuthHeaders } from '@/lib/auth-utils'
import { banUserSchema, getBanSeconds, unbanUserSchema } from './ban-schema'

export async function banUser(input: unknown): Promise<ActionMessageResult> {
  const parsed = banUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  let banExpiresIn: number | undefined
  try {
    banExpiresIn = getBanSeconds(parsed.data)
  } catch {
    return { success: false, message: 'Choose an expiry in the future, within 10 years.' }
  }
  return changeBan(async () => {
    await auth.api.banUser({
      headers: await getAuthHeaders(),
      body: { userId: parsed.data.userId, banReason: parsed.data.banReason, ...(banExpiresIn === undefined ? {} : { banExpiresIn }) }
    })
  }, 'User banned. Active sessions have been revoked.')
}

export async function unbanUser(input: unknown): Promise<ActionMessageResult> {
  const parsed = unbanUserSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid user.' }
  return changeBan(async () => {
    await auth.api.unbanUser({ headers: await getAuthHeaders(), body: parsed.data })
  }, 'Ban removed. The user can sign in again.')
}

async function changeBan(work: () => Promise<void>, message: string): Promise<ActionMessageResult> {
  try {
    await getSettingsActor(true)
    // The Better Auth hook independently checks fresh sessions and target roles,
    // including calls sent directly to the HTTP endpoints.
    await work()
  } catch (error) {
    if (error instanceof AvatarError) return { success: false, message: error.message }
    if (error instanceof APIError && ['BAD_REQUEST', 'FORBIDDEN', 'UNAUTHORIZED', 'NOT_FOUND'].includes(String(error.status))) {
      return { success: false, message: error.body?.message ?? 'You cannot manage bans for this user.' }
    }
    console.error('Could not update user ban.')
    return { success: false, message: 'Could not update this ban. Please try again.' }
  }
  try {
    revalidatePath('/moderator', 'layout')
    revalidatePath('/account', 'layout')
  } catch {
    return { success: true, message: `${message} Reload to see the updated status.` }
  }
  return { success: true, message }
}
