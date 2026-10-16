'use client'

import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl'
import type { Locale } from './routing'

// Called only at interactive boundaries with the namespaces that boundary needs.
// The client entry avoids implicit request-time `now`/headers reads by the server provider.
export function ClientMessages({ locale, messages, children }: { locale: Locale; messages: AbstractIntlMessages; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Nicosia">
      {children}
    </NextIntlClientProvider>
  )
}
