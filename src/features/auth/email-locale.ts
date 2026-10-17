import { type Locale, isLocalizedPath, stripLocale } from '@/i18n/routing'

const localeHeader = 'x-kalodeal-locale'

export function getAuthLocaleHeaders(locale: Locale) {
  return { [localeHeader]: locale }
}

export function getSameOriginEmailCallback(value: string | null, origin: string) {
  if (!value || /[\s\\]/.test(value)) return null
  try {
    const url = new URL(value, origin)
    return url.origin === origin && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}

// Auth endpoints have no next-intl root parameter. Pass the UI locale explicitly;
// same-origin page/callback URLs support older clients and server-side auth calls.
export function getAuthEmailLocale(emailUrl: string, request?: Request): Locale {
  const explicit = request?.headers.get(localeHeader)
  if (explicit !== undefined && explicit !== null) return explicit === 'el' ? 'el' : 'en'
  const url = new URL(emailUrl)
  const referrer = getSameOriginEmailCallback(request?.headers.get('referer') ?? null, url.origin)
  const callback = getSameOriginEmailCallback(url.searchParams.get('callbackURL'), url.origin)
  for (const page of [referrer, callback]) {
    if (page && isLocalizedPath(stripLocale(page.pathname))) {
      return /^\/el(?:\/|$)/.test(page.pathname) ? 'el' : 'en'
    }
  }
  return 'en'
}
