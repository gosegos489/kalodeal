import { APIError } from 'better-auth/api'
import 'server-only'
import { accountTypeSchema } from '@/entities/user/account-type'
import { displayNameSchema } from './schema'

export const privateProfileFields = [
  'image',
  'pendingAvatarKey',
  'avatarCleanupKey',
  'pendingName',
  'businessName',
  'pendingBusinessName',
  'businessNameModerationMessage',
  'businessProfile',
  'nameModerationMessage',
  'avatarModerationMessage'
]

export function guardAuthProfileData(data: Record<string, unknown>, isUpdate: boolean) {
  if (privateProfileFields.some((field) => field in data) || (isUpdate && 'name' in data)) {
    throw new APIError('BAD_REQUEST', { message: 'Manage profile names and avatars through account settings and moderation.' })
  }
}

export function guardAuthAccountType(data: Record<string, unknown>, isUpdate: boolean, isSignUp: boolean) {
  if (isSignUp && 'role' in data) {
    throw new APIError('BAD_REQUEST', { message: 'Roles cannot be selected during registration.' })
  }
  if (!('accountType' in data)) return
  if (isUpdate) throw new APIError('BAD_REQUEST', { message: 'Manage account type through account settings.' })
  if (!accountTypeSchema.safeParse(data.accountType).success) {
    throw new APIError('BAD_REQUEST', { message: 'Invalid account type.' })
  }
}

export function prepareNewProfileName(name: unknown) {
  const parsed = displayNameSchema.safeParse(name)
  if (!parsed.success) throw new APIError('BAD_REQUEST', { message: parsed.error.issues[0].message })
  return { name: '', pendingName: parsed.data || null }
}
