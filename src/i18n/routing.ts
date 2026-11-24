import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'el'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // URLs are authoritative. Bare English deep links never depend on browser/cookie preferences.
  localeDetection: false,
  localeCookie: false,
  // Metadata owns alternates, including visibility checks for individual listings.
  alternateLinks: false
})
export type Locale = (typeof routing.locales)[number]

export function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|el)(?=\/|$)/, '') || '/'
}

export function isLocalizedPath(pathname: string) {
  return (
    [
      '/',
      '/pricing',
      '/how-it-works',
      '/safety',
      '/contact-us',
      '/legal/privacy-policy',
      '/legal/terms-of-use',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password'
    ].includes(pathname) ||
    pathname === '/sell' ||
    pathname === '/messages' ||
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    (/^\/(listings|sellers)\/[^/]+$/.test(pathname) && !pathname.endsWith('.xml'))
  )
}

export function localizeHref(href: string, locale: Locale) {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const originalPathname = href.split(/[?#]/, 1)[0]
  const pathname = stripLocale(originalPathname)
  if (!isLocalizedPath(pathname)) return href
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${prefix}${pathname === '/' && prefix ? '' : pathname}${href.slice(originalPathname.length)}`
}
