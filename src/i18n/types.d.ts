import type { formats } from './formats'
import type messages from './messages/en.json'
import type { Locale as AppLocale } from './routing'

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale
    Messages: typeof messages
    Formats: typeof formats
  }
}
