import { authClient } from '@/lib/auth-client'
import type { ResetPasswordInput } from '../types/auth'

export function resetPassword({ password }: ResetPasswordInput, token: string) {
  return authClient.resetPassword({ newPassword: password, token })
}
