import { authClient } from '@/lib/auth-client'
import type { ForgotPasswordInput } from '../types/auth'

export function requestPasswordReset({ email }: ForgotPasswordInput) {
  return authClient.requestPasswordReset({
    email: email.trim().toLowerCase(),
    redirectTo: '/reset-password'
  })
}
