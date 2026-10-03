'use client'

import { BarChart3, CreditCard, Heart, LayoutDashboard, List, Loader2, LogOut, MessageCircle, ReceiptText, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
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

export function AccountNavigation() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const result = await authClient.signOut()
      if (result.error) {
        toast.add({ title: 'Could not log out', description: 'Please try again.', type: 'error' })
        setIsLoggingOut(false)
        return
      }

      // Reload so cached account pages and server-rendered session UI are cleared.
      window.location.replace('/')
    } catch {
      toast.add({ title: 'Could not log out', description: 'Please try again.', type: 'error' })
      setIsLoggingOut(false)
    }
  }

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
      <Button
        type="button"
        variant="ghost"
        disabled={isLoggingOut}
        aria-busy={isLoggingOut}
        onClick={handleLogout}
        className="text-muted-foreground h-auto justify-start gap-3 px-3 py-3 font-normal"
      >
        {isLoggingOut ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LogOut aria-hidden="true" className="size-4" />}
        {isLoggingOut ? 'Logging out…' : 'Logout'}
      </Button>
    </nav>
  )
}
