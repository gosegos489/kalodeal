import { getLocale, getMessages } from 'next-intl/server'
import { ClientMessages } from '@/i18n/client-messages'

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  return (
    <ClientMessages locale={locale} messages={{ PricingError: messages.PricingError }}>
      {children}
    </ClientMessages>
  )
}
