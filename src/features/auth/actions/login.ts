import { authClient } from '@/lib/auth-client'
import { getLoginRedirect } from '../login-redirect'
import type { LoginInput } from '../types/auth'

export function login({ email, password }: LoginInput, returnTo?: string) {
  return authClient.signIn.email({
    email: email.trim().toLowerCase(),
    password,
    callbackURL: getLoginRedirect(returnTo)
  })
}
