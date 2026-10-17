'use client'

import { Menu } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { localizeHref, stripLocale } from '@/i18n/routing'
import { getHeaderAccountNavigation, mobileNavigation } from '../mocks/mocks'
import { NavigationLinks } from './header-navigation'
import { HeaderUnreadMessagesBadge as UnreadMessagesBadge } from './header-unread-messages-badge'

type Props = {
  isAuth: boolean
  currentYear: number
  role?: string | null
}

export default function MobileMenu({ isAuth, currentYear, role }: Props) {
  const pathname = stripLocale(usePathname())
  const locale = useLocale()
  const t = useTranslations('Navigation')
  const [open, setOpen] = useState(false)
  const closeMenu = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="relative size-10 xl:hidden" aria-label={t('openMenu')}>
            <Menu className="size-5" />
            {isAuth && role !== 'moderator' && <UnreadMessagesBadge className="absolute -top-1 -right-1 text-[10px]" />}
          </Button>
        }
      />
      <SheetContent closeLabel={t('close')} side="right" className="w-[min(20rem,calc(100vw-2rem))] gap-0 p-0">
        <SheetHeader className="border-border border-b px-5 py-4">
          <SheetTitle>{t('menu')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 p-4">
            <nav aria-label={t('mobilePrimary')}>
              <NavigationLinks mobile onNavigate={closeMenu} />
            </nav>

            <nav aria-label={t('moreNavigation')} className="border-border border-t pt-4">
              <h3 className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wide uppercase">{t('more')}</h3>
              <ul className="flex flex-col gap-1">
                {mobileNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                      <Link
                        href={localizeHref(item.href, locale)}
                        onClick={closeMenu}
                        aria-current={isActive ? 'page' : undefined}
                        className={`hover:bg-muted flex h-10 items-center rounded-lg px-3 text-sm transition-colors ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                      >
                        {t(item.label)}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="border-border border-t pt-4">
              {isAuth ? (
                <ul className="flex flex-col gap-1">
                  {getHeaderAccountNavigation(role).map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <li key={item.href}>
                        <Link
                          href={localizeHref(item.href, locale)}
                          onClick={closeMenu}
                          aria-current={isActive ? 'page' : undefined}
                          className={`hover:bg-muted flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                        >
                          <item.icon className="size-5" strokeWidth={2} />
                          {item.label === 'Moderator panel' ? item.label : t(item.label)}
                          {item.href === '/account/messages' && <UnreadMessagesBadge className="ml-auto" />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <Link
                  href={localizeHref('/login', locale)}
                  onClick={closeMenu}
                  className="text-muted-foreground hover:bg-muted hover:text-primary flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors"
                >
                  {t('signIn')}
                </Link>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-border border-t px-5 py-4">
          <p className="text-muted-foreground text-xs">© {currentYear} Kalodeal</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
