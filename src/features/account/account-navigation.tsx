'use client'

import { BarChart3, ChevronDown, CreditCard, Heart, LayoutDashboard, List, MessageCircle, ReceiptText, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/features/auth/logout-button'
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
  return (
    <>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = isActiveRoute(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors outline-none focus-visible:ring-2',
              active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
            {href === '/account/analytics' && (
              <Badge variant="outline" className="ml-auto">
                Pro
              </Badge>
            )}
          </Link>
        )
      })}
    </>
  )
}

function MobileAccountMenu({ pathname }: { pathname: string }) {
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
            aria-label={`Account menu: ${currentItem.label}`}
          >
            <Icon aria-hidden="true" className="text-primary size-4" />
            <span className="min-w-0 whitespace-normal">{currentItem.label}</span>
            {currentItem.href === '/account/analytics' && <Badge variant="outline">Pro</Badge>}
            <ChevronDown aria-hidden="true" className="text-muted-foreground ml-auto size-4" />
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-xl [&_[data-slot=sheet-close]]:size-11">
        <SheetHeader className="shrink-0 border-b pr-14">
          <SheetTitle>Account menu</SheetTitle>
          <SheetDescription>Choose a section of your account.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile account navigation" className="flex min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
          <AccountNavigationLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <SheetFooter className="shrink-0 border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <LogoutButton />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function AccountNavigation() {
  const pathname = usePathname()

  return (
    <>
      <MobileAccountMenu key={pathname} pathname={pathname} />
      <nav aria-label="Account navigation" className="hidden flex-col gap-1 p-2 lg:flex">
        <AccountNavigationLinks pathname={pathname} />
        <LogoutButton />
      </nav>
    </>
  )
}
