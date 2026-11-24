import { getLocale, getMessages } from 'next-intl/server'
import { ClientMessages } from '@/i18n/client-messages'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <ClientMessages locale={locale} messages={{ Sellers: messages.Sellers }}>
      {children}
    </ClientMessages>
  )
}
