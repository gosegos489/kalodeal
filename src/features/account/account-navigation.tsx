'use client'

import { BarChart3, CreditCard, Heart, LayoutDashboard, List, MessageCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Account', href: '/account', icon: LayoutDashboard },
  { label: 'My listings', href: '/account/listings', icon: List },
  { label: 'Favorites', href: '/account/favorites', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'My plan', href: '/account/subscription', icon: CreditCard },
  { label: 'Analytics', href: '/account/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/account/settings', icon: Settings }
]

export function AccountNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Account navigation" className="flex gap-1 overflow-x-auto p-2 lg:flex-col">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active =
          href === '/account/settings'
            ? ['/account/settings', '/account/profile', '/account/security'].some((path) => pathname === path || pathname.startsWith(`${path}/`))
            : pathname === href || (href !== '/account' && pathname.startsWith(`${href}/`))

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2',
              active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            {href === '/account/analytics' && (
              <Badge variant="outline" className="ml-auto">
                Pro
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
