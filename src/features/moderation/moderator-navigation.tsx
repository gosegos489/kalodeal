'use client'

import { Flag, Images, LayoutDashboard, List, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/features/auth/logout-button'
import { cn } from '@/lib/utils'

export const moderatorNavigation = [
  { label: 'Dashboard', href: '/moderator', icon: LayoutDashboard },
  { label: 'Listings', href: '/moderator/listings', icon: List },
  { label: 'Profiles', href: '/moderator/avatars', icon: Images },
  { label: 'Users', href: '/moderator/users', icon: Users },
  { label: 'Chat reports', href: '/moderator/chat-reports', icon: Flag }
]

export function ModeratorNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Moderator navigation" className="grid min-w-0 gap-1 p-2 sm:grid-cols-2 lg:grid-cols-1">
      {moderatorNavigation.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== '/moderator' && pathname.startsWith(`${href}/`))

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors outline-none focus-visible:ring-2',
              active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
      <LogoutButton />
    </nav>
  )
}
