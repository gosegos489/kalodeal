import { APIError } from 'better-auth/api'
import 'server-only'
import { displayNameSchema } from './schema'

export const privateProfileFields = [
  'image',
  'pendingAvatarKey',
  'avatarCleanupKey',
  'pendingName',
  'nameModerationMessage',
  'avatarModerationMessage'
]

export function guardAuthProfileData(data: Record<string, unknown>, isUpdate: boolean) {
  if (privateProfileFields.some((field) => field in data) || (isUpdate && 'name' in data)) {
    throw new APIError('BAD_REQUEST', { message: 'Manage profile names and avatars through account settings and moderation.' })
  }
}

export function prepareNewProfileName(name: unknown) {
  const parsed = displayNameSchema.safeParse(name)
  if (!parsed.success) throw new APIError('BAD_REQUEST', { message: parsed.error.issues[0].message })
  return { name: '', pendingName: parsed.data || null }
}
