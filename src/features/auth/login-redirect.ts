import { type Locale, localizeHref, routing } from '@/i18n/routing'
import { PAID_PLANS } from '@/lib/plan-limits'

// Only the known pricing continuation is allowed; arbitrary return URLs are never followed.
export function getPricingReturnTo(returnTo?: string | null) {
  for (const locale of routing.locales) {
    const pricing = localizeHref('/pricing', locale)
    if (returnTo === pricing) return returnTo
    for (const plan of PAID_PLANS) {
      if (returnTo === `${pricing}?plan=${plan}`) return returnTo
    }
  }
  return null
}

export function getLoginRedirect(returnTo?: string | null, locale: Locale = 'en') {
  return getPricingReturnTo(returnTo) ?? localizeHref('/account', locale)
}

export function getAuthHref(path: '/login' | '/register' | '/forgot-password' | '/reset-password', locale: Locale, returnTo?: string | null) {
  const href = localizeHref(path, locale)
  const continuation = getPricingReturnTo(returnTo)
  return continuation ? `${href}?${new URLSearchParams({ returnTo: continuation })}` : href
}
