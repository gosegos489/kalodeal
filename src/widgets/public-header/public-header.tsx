import { getMessages, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientMessages } from '@/i18n/client-messages'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import ActionButtonsWithSession from './ui/action-buttons-with-session'
import { CategoryHeaderNavigation } from './ui/category-header-navigation'
import { LanguageSwitcher } from './ui/language-switcher'
import MobileMenuWithSession from './ui/mobile-menu-with-session'

export async function PublicHeader({ locale = 'en' }: { locale?: Locale }) {
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Navigation' })
  return (
    <ClientMessages
      locale={locale}
      messages={{ Navigation: messages.Navigation, Search: { updateError: messages.Search.updateError, retry: messages.Search.retry } }}
    >
      <header className="border-border bg-card border-b">
        <div className="container flex items-center justify-between gap-3 py-3 sm:py-4">
          <div className="flex min-w-0 items-center gap-6 2xl:gap-10">
            <Link href="/" className="shrink-0">
              <Image src="/logo.svg" alt="Kalodeal" width={590} height={169} className="h-auto w-24 sm:w-29.5" loading="eager" />
            </Link>

            <nav aria-label={t('primary')} className="hidden xl:block">
              <Suspense fallback={<Skeleton className="h-5 w-64" />}>
                <CategoryHeaderNavigation locale={locale} />
              </Suspense>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Suspense
              fallback={
                <div className="flex items-center gap-1 sm:gap-2" role="status" aria-label={t('loadingAccount')}>
                  <Skeleton className="hidden h-10 w-32 md:block" />
                  <Skeleton className="size-10 sm:w-20 md:w-40" />
                </div>
              }
            >
              <ActionButtonsWithSession />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-10 w-20 rounded-lg" />}>
              <LanguageSwitcher />
            </Suspense>
            <Suspense fallback={<Skeleton className="size-10 xl:hidden" />}>
              <MobileMenuWithSession locale={locale} />
            </Suspense>
          </div>
        </div>
      </header>
    </ClientMessages>
  )
}
