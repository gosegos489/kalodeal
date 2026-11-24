'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { localizeHref, stripLocale } from '@/i18n/routing'
import { navigation } from '../mocks/mocks'

type NavigationLinksProps = {
  mobile?: boolean
  onNavigate?: () => void
  categoriesControl: ReactNode
}

export function NavigationLinks({ mobile = false, onNavigate, categoriesControl }: NavigationLinksProps) {
  const pathname = stripLocale(usePathname())
  const locale = useLocale()
  const t = useTranslations('Navigation')

  return (
    <ul className={mobile ? 'flex flex-col gap-1' : 'flex items-center gap-5 text-sm whitespace-nowrap 2xl:gap-7'}>
      {navigation.map((item) => {
        if (item.label === 'categories') return <li key={item.label}>{categoriesControl}</li>
        const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <li key={item.label}>
            <Link
              href={localizeHref(item.href, locale)}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={
                mobile
                  ? `hover:bg-muted flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`
                  : `hover:text-primary transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              {t(item.label)}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
