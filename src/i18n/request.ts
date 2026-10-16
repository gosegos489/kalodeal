import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { locale as rootLocale } from 'next/root-params'
import { routing } from './routing'

export default getRequestConfig(async ({ locale: override }) => {
  // Root parameters participate in Cache Components keys; no headers/cookies or mutable locale store.
  const value = override ?? (await rootLocale())
  const locale = hasLocale(routing.locales, value) ? value : routing.defaultLocale
  return {
    locale,
    timeZone: 'Asia/Nicosia',
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
