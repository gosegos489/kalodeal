import { type Locale, localizeHref, stripLocale } from '@/i18n/routing'
import { getSameOriginEmailCallback } from './email-locale'
import { getAuthHref, getPricingReturnTo } from './login-redirect'

export function localizeAuthEmailUrl(value: string, locale: Locale, kind: 'verification' | 'reset') {
  const url = new URL(value)
  const callback = getSameOriginEmailCallback(url.searchParams.get('callbackURL'), url.origin)
  let destination = localizeHref('/', locale)
  if (kind === 'reset') {
    const returnTo =
      callback && stripLocale(callback.pathname) === '/reset-password' ? getPricingReturnTo(callback.searchParams.get('returnTo')) : null
    destination = getAuthHref('/reset-password', locale, returnTo ? localizeHref(returnTo, locale) : null)
  } else if (callback) {
    const pricing = getPricingReturnTo(`${callback.pathname}${callback.search}`)
    if (pricing) destination = localizeHref(pricing, locale)
  }
  // Leave the Better Auth endpoint and token untouched. Only allow existing app
  // destinations, rather than echoing a client-supplied redirect into the email.
  url.searchParams.set('callbackURL', destination)
  return url.href
}
