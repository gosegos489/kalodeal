'use server'

import { APIError } from 'better-auth/api'
import { revalidatePath, updateTag } from 'next/cache'
import type { ActionMessageResult } from '@/lib/action-result'
import { auth } from '@/lib/auth'
import { getAuthHeaders } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { checkPasswordChangeRateLimit } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { AvatarError } from './avatar-lifecycle'
import { businessDetailsSchema, businessReviewSchema } from './business-schema'
import { convertToBusiness, reviewBusinessDetails, submitBusinessDetails } from './business-workflow'
import { reviewProfileName, submitBusinessName, submitProfileName } from './name-moderation'
import { avatarModerationSchema, businessNameSchema, nameModerationSchema, passwordChangeSchema, profileSchema } from './schema'
import { avatars, getMarketplaceSettingsActor, getSettingsActor } from './server'

function refreshProfile(publicChanged = false) {
  if (publicChanged) updateTag(cacheTags.sellers)
  revalidatePath('/account/settings')
  revalidatePath('/admin')
  revalidatePath('/moderator', 'layout')
  revalidatePath('/moderator/avatars')
  if (publicChanged) {
    revalidatePath('/sellers/[id]', 'page')
    revalidatePath('/account')
    revalidatePath('/listings/[id]', 'page')
    revalidatePath('/account/messages', 'layout')
    revalidatePath('/moderator/users')
  }
}

export async function enableBusinessAccount(): Promise<ActionMessageResult> {
  try {
    await convertToBusiness()
  } catch (error) {
    return failure(error)
  }
  try {
    refreshProfile(true)
  } catch {
    /* The account change is already committed. */
  }
  return { success: true, message: 'Business Account enabled. Your subscription and listings are unchanged.' }
}

export async function saveBusinessDetails(input: unknown): Promise<ActionMessageResult> {
  const parsed = businessDetailsSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  let pending: boolean
  try {
    pending = await submitBusinessDetails(parsed.data)
  } catch (error) {
    return failure(error)
  }
  try {
    refreshProfile(true)
  } catch {
    /* Preserve committed success if refresh fails. */
  }
  return { success: true, message: pending ? 'Business details sent for moderation. Approved details remain public.' : 'Business details saved.' }
}

export async function moderateBusinessDetails(input: unknown): Promise<ActionMessageResult> {
  const parsed = businessReviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid moderation request.' }
  try {
    await reviewBusinessDetails(parsed.data)
  } catch (error) {
    return failure(error)
  }
  try {
    refreshProfile(parsed.data.decision === 'approve')
  } catch {
    /* Preserve committed success. */
  }
  return { success: true, message: 'Business profile review saved.' }
}

async function failure(error: unknown): Promise<ActionMessageResult> {
  if (error instanceof AvatarError) return { success: false, message: error.message }
  await captureServerException(error, { feature: 'account-settings', operation: 'mutation' })
  console.error('Account settings operation failed.', error instanceof Error ? error.name : 'Unknown error')
  return { success: false, message: 'Could not update your account. Please try again.' }
}

export async function saveProfile(input: unknown): Promise<ActionMessageResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  try {
    const pending = await submitProfileName(parsed.data)
    refreshProfile(parsed.data.name === '')
    return { success: true, message: pending ? 'Your new name has been sent for moderation. Your public name is unchanged.' : 'Profile saved.' }
  } catch (error) {
    return failure(error)
  }
}

export async function saveBusinessName(input: unknown): Promise<ActionMessageResult> {
  const parsed = businessNameSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  let pending: boolean
  try {
    pending = await submitBusinessName(parsed.data)
  } catch (error) {
    return failure(error)
  }
  const message = pending ? 'Your business name has been sent for moderation.' : 'Business name saved.'
  try {
    refreshProfile(parsed.data.businessName === '')
  } catch {
    return { success: true, message: `${message} Reload to see the update.` }
  }
  return { success: true, message }
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
      if (error.statusCode >= 500) await captureServerException(error, { feature: 'auth', operation: 'change-password' })
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
    const actor = await getMarketplaceSettingsActor()
    const cleaned = await avatars.remove(actor.id)
    refreshProfile(true)
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
    const cleaned = await avatars.moderate(userId, version, parsed.data)
    refreshProfile(decision === 'approve')
    return {
      success: true,
      message: `${decision === 'request-changes' ? 'Avatar changes requested' : `Avatar ${decision === 'approve' ? 'approved' : 'rejected'}`}.${cleaned ? '' : ' Storage cleanup will be retried.'}`
    }
  } catch (error) {
    return failure(error)
  }
}

export async function moderateName(input: unknown): Promise<ActionMessageResult> {
  const parsed = nameModerationSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
  try {
    await reviewProfileName(parsed.data)
    refreshProfile(parsed.data.decision === 'approve')
    return {
      success: true,
      message:
        parsed.data.decision === 'request-changes'
          ? 'Profile name changes requested.'
          : `Profile name ${parsed.data.decision === 'approve' ? 'approved' : 'rejected'}.`
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
