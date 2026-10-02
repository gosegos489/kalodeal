'use server'

import { APIError } from 'better-auth/api'
import { revalidatePath } from 'next/cache'
import type { ActionMessageResult } from '@/lib/action-result'
import { auth } from '@/lib/auth'
import { getAuthHeaders } from '@/lib/auth-utils'
import { checkPasswordChangeRateLimit } from '@/lib/rate-limit'
import { AvatarError } from './avatar-lifecycle'
import { avatarModerationSchema, passwordChangeSchema, profileSchema } from './schema'
import { avatars, getSettingsActor } from './server'

function refreshProfile() {
  revalidatePath('/account', 'layout')
  revalidatePath('/listings/[id]', 'page')
  revalidatePath('/admin')
  revalidatePath('/moderator')
}

function failure(error: unknown): ActionMessageResult {
  if (error instanceof AvatarError) return { success: false, message: error.message }
  console.error('Account settings operation failed.', error instanceof Error ? error.name : 'Unknown error')
  return { success: false, message: 'Could not update your account. Please try again.' }
}

export async function saveProfile(input: unknown): Promise<ActionMessageResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  try {
    await getSettingsActor()
    await auth.api.updateUser({ headers: await getAuthHeaders(), body: { name: parsed.data.name } })
    refreshProfile()
    return { success: true, message: 'Profile saved.' }
  } catch (error) {
    return failure(error)
  }
}

export async function changeAccountPassword(input: unknown): Promise<ActionMessageResult> {
  const parsed = passwordChangeSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  try {
    const actor = await getSettingsActor()
    const limit = await checkPasswordChangeRateLimit(actor.id)
    if (!limit.success) return { success: false, message: limit.message }
    await auth.api.changePassword({
      headers: await getAuthHeaders(),
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.password, revokeOtherSessions: true }
    })
    return { success: true, message: 'Password changed. Your other sessions have been signed out.' }
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code
      const message =
        code === 'INVALID_PASSWORD'
          ? 'Your current password is incorrect.'
          : code === 'SESSION_NOT_FRESH'
            ? 'Sign in again before changing your password.'
            : error.status === 'TOO_MANY_REQUESTS'
              ? 'Too many attempts. Please try again later.'
              : 'Could not change your password. Please sign in again and retry.'
      return { success: false, message }
    }
    return failure(error)
  }
}

export async function removeAvatar(): Promise<ActionMessageResult> {
  try {
    const actor = await getSettingsActor()
    const cleaned = await avatars.remove(actor.id)
    refreshProfile()
    return {
      success: true,
      message: cleaned
        ? 'Avatar removed. Any pending replacement has been cancelled.'
        : 'Avatar removed from your profile. Storage cleanup will be retried.'
    }
  } catch (error) {
    return failure(error)
  }
}

export async function moderateAvatar(input: unknown): Promise<ActionMessageResult> {
  const parsed = avatarModerationSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid moderation request.' }
  try {
    await getSettingsActor(true)
    const { userId, version, decision } = parsed.data
    const cleaned = await avatars.moderate(userId, version, decision)
    refreshProfile()
    return {
      success: true,
      message: `Avatar ${decision === 'approve' ? 'approved' : 'rejected'}.${cleaned ? '' : ' Storage cleanup will be retried.'}`
    }
  } catch (error) {
    return failure(error)
  }
}

export async function retryAvatarCleanup(userId: unknown): Promise<ActionMessageResult> {
  if (typeof userId !== 'string' || !userId || userId.length > 128) return { success: false, message: 'Invalid account.' }
  try {
    const actor = await getSettingsActor()
    if (actor.id !== userId) await getSettingsActor(true)
    await avatars.cleanup(userId)
    refreshProfile()
    return { success: true, message: 'Avatar storage cleanup completed.' }
  } catch (error) {
    return failure(error)
  }
}
