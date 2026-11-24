import { createFormatter } from 'next-intl'
import { DISPLAY_TIME_ZONE, formats } from './formats'
import type { Locale } from './routing'

const formatters = new Map<Locale, ReturnType<typeof createFormatter>>()

// Outside React use an explicit locale. English is also the intentional staff fallback.
// Reuse next-intl's Intl caches rather than constructing a formatter per list item.
export function getDisplayFormatter(locale: string) {
  const supportedLocale = locale === 'el' ? 'el' : 'en'
  let formatter = formatters.get(supportedLocale)
  if (!formatter) {
    formatter = createFormatter({ locale: supportedLocale, timeZone: DISPLAY_TIME_ZONE, formats })
    formatters.set(supportedLocale, formatter)
  }
  return formatter
}
