import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { rootMetadata } from '@/lib/metadata'
import { SiteDocument } from '@/shared/ui/site-document'

export const metadata = rootMetadata

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  return <SiteDocument locale={locale}>{children}</SiteDocument>
}
