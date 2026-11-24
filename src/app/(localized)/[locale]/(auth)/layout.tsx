import type { Metadata } from 'next'
import { getLocale, getMessages } from 'next-intl/server'
import { ClientMessages } from '@/i18n/client-messages'
import { privateMetadata } from '@/lib/metadata'

export const metadata: Metadata = privateMetadata

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  return (
    <ClientMessages locale={locale} messages={{ Auth: messages.Auth }}>
      {children}
    </ClientMessages>
  )
}
