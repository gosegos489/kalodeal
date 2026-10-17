import type { Locale } from '@/i18n/routing'
import { authClient } from '@/lib/auth-client'
import { getAuthLocaleHeaders } from '../email-locale'
import { getAuthHref } from '../login-redirect'
import type { ForgotPasswordInput } from '../types/auth'

export function requestPasswordReset({ email }: ForgotPasswordInput, locale: Locale = 'en', returnTo?: string | null) {
  return authClient.requestPasswordReset(
    {
      email: email.trim().toLowerCase(),
      redirectTo: getAuthHref('/reset-password', locale, returnTo)
    },
    { headers: getAuthLocaleHeaders(locale) }
  )
}
