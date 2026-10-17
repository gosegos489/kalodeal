import { type Locale, localizeHref } from '@/i18n/routing'
import { authClient } from '@/lib/auth-client'
import { getPricingReturnTo } from '../login-redirect'
import type { RegisterInput } from '../types/auth'

export function register({ name, email, password, accountType }: RegisterInput, returnTo?: string, locale: Locale = 'en') {
  return authClient.signUp.email({
    accountType,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    callbackURL: getPricingReturnTo(returnTo) ?? localizeHref('/', locale)
  })
}
