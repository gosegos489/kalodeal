'use client'

import { ChevronRight, LayoutGrid, Menu } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { localizeHref, stripLocale } from '@/i18n/routing'
import { getHeaderAccountNavigation, mobileNavigation } from '../mocks/mocks'
import type { HeaderCategories } from './category-navigation-types'
import { NavigationLinks } from './header-navigation'
import { HeaderUnreadMessagesBadge as UnreadMessagesBadge } from './header-unread-messages-badge'
import { MobileCategories } from './mobile-categories'

type Props = HeaderCategories & {
  isAuth: boolean
  currentYear: number
  role?: string | null
}

export default function MobileMenu({ isAuth, currentYear, role, categories, unavailable }: Props) {
  const pathname = stripLocale(usePathname())
  const locale = useLocale()
  const t = useTranslations('Navigation')
  const [open, setOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const categoriesButtonRef = useRef<HTMLButtonElement>(null)
  const categoryNavigation = useRef(false)
  const closeMenu = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia('(min-width: 1280px)')
    const onChange = () => {
      if (desktop.matches) setOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [open])

  function exitCategories() {
    setShowCategories(false)
    requestAnimationFrame(() => categoriesButtonRef.current?.focus())
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          categoryNavigation.current = false
          setShowCategories(false)
        }
      }}
    >
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="relative size-10 xl:hidden" aria-label={t('openMenu')}>
            <Menu className="size-5" />
            {isAuth && role !== 'moderator' && <UnreadMessagesBadge className="absolute -top-1 -right-1 text-[10px]" />}
          </Button>
        }
      />
      <SheetContent
        data-category-menu=""
        finalFocus={() => (categoryNavigation.current ? false : true)}
        closeLabel={t('close')}
        side="right"
        className="max-w-full gap-0 p-0 data-[side=right]:w-[min(24rem,100vw)] motion-reduce:transition-none [&>[data-slot=sheet-close]]:top-2 [&>[data-slot=sheet-close]]:right-2 [&>[data-slot=sheet-close]]:size-11"
      >
        <SheetHeader className="border-border border-b px-5 py-4">
          <SheetTitle>{t(showCategories ? 'categories' : 'menu')}</SheetTitle>
          <SheetDescription className="sr-only">{t('categoryMenuDescription')}</SheetDescription>
        </SheetHeader>

        {showCategories ? (
          <MobileCategories
            categories={categories}
            unavailable={unavailable}
            onExit={exitCategories}
            onNavigate={() => {
              categoryNavigation.current = true
              closeMenu()
            }}
          />
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-6 p-4">
              <nav aria-label={t('mobilePrimary')}>
                <NavigationLinks
                  mobile
                  onNavigate={closeMenu}
                  categoriesControl={
                    <button
                      ref={categoriesButtonRef}
                      type="button"
                      onClick={() => setShowCategories(true)}
                      className="text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2"
                    >
                      <LayoutGrid aria-hidden="true" className="size-5" /> {t('categories')}{' '}
                      <ChevronRight aria-hidden="true" className="ml-auto size-4" />
                    </button>
                  }
                />
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
        )}

        <SheetFooter className="border-border border-t px-5 py-4">
          <p className="text-muted-foreground text-xs">© {currentYear} Kalodeal</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
