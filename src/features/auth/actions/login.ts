import type { Locale } from '@/i18n/routing'
import { authClient } from '@/lib/auth-client'
import { getLoginRedirect } from '../login-redirect'
import type { LoginInput } from '../types/auth'

export function login({ email, password }: LoginInput, returnTo?: string, locale: Locale = 'en') {
  return authClient.signIn.email({
    email: email.trim().toLowerCase(),
    password,
    callbackURL: getLoginRedirect(returnTo, locale)
  })
}
