import { MapPin } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Suspense } from 'react'
import { type Locale, localizeHref } from '@/i18n/routing'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession } from '@/lib/auth-utils'
import { getCurrentYear } from '@/lib/get-current-year'
import { footerLinks } from './mocks/mocks'
import FooterLink from './ui/footer-link'

async function FooterNavigation({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Footer' })
  const nav = await getTranslations({ locale, namespace: 'Navigation' })
  const session = await getSession(true)
  const links = footerLinks.map((group) => ({
    ...group,
    links: group.links.filter(([, href]) => canUseMarketplace(session?.user.role) || (href !== '/sell' && !href.startsWith('/account')))
  }))
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      {links.map((group) => (
        <div className="flex flex-col gap-3" key={t(group.title)}>
          <h2 className="text-sm font-semibold">{t(group.title)}</h2>

          <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
            {group.links.map(([label, href]) => {
              return (
                <li key={label}>
                  <Suspense fallback={null}>
                    <FooterLink href={localizeHref(href, locale)} label={label === 'browse' || label === 'saved' ? t(label) : nav(label)} />
                  </Suspense>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export const PublicFooter = async ({ locale = 'en' }: { locale?: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'Footer' })
  const currentYear = await getCurrentYear()

  return (
    <footer className="bg-muted text-foreground">
      <div className="container flex flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Image src="/logo.svg" alt="Kalodeal" width={590} height={169} className="h-auto w-29.5" />

            <p className="text-muted-foreground max-w-sm text-sm leading-6">{t('description')}</p>

            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="text-accent size-4" aria-hidden="true" />
              {t('community')}
            </p>
          </div>

          <Suspense fallback={null}>
            <FooterNavigation locale={locale} />
          </Suspense>
        </div>

        <div className="border-t border-t-gray-300 pt-4">
          <p className="text-muted-foreground text-sm">{t('copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
