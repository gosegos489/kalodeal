'use client'

import { BarChart3, ChevronDown, CreditCard, Heart, LayoutDashboard, List, MessageCircle, ReceiptText, Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/features/auth/logout-button'
import { UnreadMessagesBadge } from '@/features/messages/unread-badge'
import { localizeHref, stripLocale } from '@/i18n/routing'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Account', href: '/account', icon: LayoutDashboard },
  { label: 'My listings', href: '/account/listings', icon: List },
  { label: 'Favorites', href: '/account/favorites', icon: Heart },
  { label: 'Messages', href: '/account/messages', icon: MessageCircle },
  { label: 'My plan', href: '/account/subscription', icon: CreditCard },
  { label: 'Orders', href: '/account/orders', icon: ReceiptText },
  { label: 'Analytics', href: '/account/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/account/settings', icon: Settings }
]

function isActiveRoute(pathname: string, href: string) {
  return href === '/account/settings'
    ? ['/account/settings', '/account/profile', '/account/security'].some((path) => pathname === path || pathname.startsWith(`${path}/`))
    : pathname === href || (href !== '/account' && pathname.startsWith(`${href}/`))
}

function AccountNavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const locale = useLocale()

  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  return (
    <>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = isActiveRoute(pathname, href)

        return (
          <Link
            key={href}
            href={localizeHref(href, locale)}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors outline-none focus-visible:ring-2',
              active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {copy(label)}
            {href === '/account/messages' && (
              <UnreadMessagesBadge formatLabel={(count) => t('valueUnreadMessages', { value0: count })} className="ml-auto" />
            )}
            {href === '/account/analytics' && (
              <Badge variant="outline" className="ml-auto">
                Plus+
              </Badge>
            )}
          </Link>
        )
      })}
    </>
  )
}

function MobileAccountMenu({ pathname }: { pathname: string }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const [open, setOpen] = useState(false)
  const currentItem = navigation.find(({ href }) => isActiveRoute(pathname, href)) ?? navigation[0]
  const Icon = currentItem.icon

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="h-12 w-full min-w-0 justify-start gap-3 px-4 lg:hidden"
            aria-label={t('accountMenuValue', { value0: copy(currentItem.label) })}
          >
            <Icon aria-hidden="true" className="text-primary size-4" />
            <span className="min-w-0 whitespace-normal">{copy(currentItem.label)}</span>
            {currentItem.href === '/account/messages' && <UnreadMessagesBadge formatLabel={(count) => t('valueUnreadMessages', { value0: count })} />}
            {currentItem.href === '/account/analytics' && <Badge variant="outline">Plus+</Badge>}
            <ChevronDown aria-hidden="true" className="text-muted-foreground ml-auto size-4" />
          </Button>
        }
      />
      <SheetContent closeLabel={t('close')} side="bottom" className="max-h-[85dvh] gap-0 rounded-t-xl [&_[data-slot=sheet-close]]:size-11">
        <SheetHeader className="shrink-0 border-b pr-14">
          <SheetTitle>{t('accountMenu')}</SheetTitle>
          <SheetDescription>{t('chooseASectionOfYourAccount')}</SheetDescription>
        </SheetHeader>
        <nav aria-label={t('mobileAccountNavigation')} className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
          <AccountNavigationLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <SheetFooter className="shrink-0 border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <AccountLogoutButton />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function AccountNavigation() {
  const t = useTranslations('Workspace')

  const pathname = stripLocale(usePathname())

  return (
    <>
      <MobileAccountMenu key={pathname} pathname={pathname} />
      <nav aria-label={t('accountNavigation')} className="hidden flex-col gap-1 p-2 lg:flex">
        <AccountNavigationLinks pathname={pathname} />
        <AccountLogoutButton />
      </nav>
    </>
  )
}

function AccountLogoutButton() {
  const locale = useLocale()
  const t = useTranslations('Workspace')
  return (
    <LogoutButton
      locale={locale}
      labels={{ logout: t('logout'), loggingOut: t('loggingOut'), error: t('couldNotLogOut'), retry: t('pleaseTryAgain') }}
    />
  )
}
