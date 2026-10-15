'use client'

import { Flag, Gift, Images, LayoutDashboard, List, Mail, Tags, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/features/auth/logout-button'
import { cn } from '@/lib/utils'

export const moderatorNavigation = [
  { label: 'Dashboard', href: '/moderator', icon: LayoutDashboard },
  { label: 'Listings', href: '/moderator/listings', icon: List },
  { label: 'Profiles', href: '/moderator/avatars', icon: Images },
  { label: 'Users', href: '/moderator/users', icon: Users },
  { label: 'Access grants', href: '/moderator/access-grants', icon: Gift },
  { label: 'Contact requests', href: '/moderator/contact', icon: Mail },
  { label: 'Chat reports', href: '/moderator/chat-reports', icon: Flag },
  { label: 'Category icons', href: '/moderator/categories', icon: Tags, categoryIconsOnly: true }
]

const countsSchema = z.object({ pendingListings: z.number().int().min(0), pendingAvatars: z.number().int().min(0) })
type QueueCounts = z.infer<typeof countsSchema>

export function ModeratorNavigation({ canEditCategoryIcons = false, initialCounts }: { canEditCategoryIcons?: boolean; initialCounts: QueueCounts }) {
  const pathname = usePathname()
  const [latest, setLatest] = useState<{ baseline: QueueCounts; counts: QueueCounts } | null>(null)
  const counts = latest?.baseline === initialCounts ? latest.counts : initialCounts

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    let busy = false
    async function refresh() {
      if (disposed || busy || document.visibilityState !== 'visible') return
      busy = true
      try {
        const response = await fetch('/api/moderation/counts', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal })
        const result = countsSchema.safeParse(await response.json())
        if (disposed) return
        if (response.ok && result.success) setLatest({ baseline: initialCounts, counts: result.data })
        else if (response.status === 401 || response.status === 403)
          setLatest({ baseline: initialCounts, counts: { pendingListings: 0, pendingAvatars: 0 } })
      } catch {
        /* Keep the last confirmed counts on temporary network failures. */
      } finally {
        busy = false
      }
    }
    const onVisible = () => {
      void refresh()
    }
    // Small count-only reads for other staff actions, without another RSC poller.
    const interval = setInterval(onVisible, 60000)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      disposed = true
      controller.abort()
      clearInterval(interval)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [initialCounts])

  return (
    <nav aria-label="Moderator navigation" className="grid min-w-0 gap-1 p-2 sm:grid-cols-2 lg:grid-cols-1">
      {moderatorNavigation
        .filter((item) => !item.categoryIconsOnly || canEditCategoryIcons)
        .map(({ label, href, icon: Icon }) => {
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
              {href === '/moderator/listings' && counts.pendingListings > 0 && (
                <Badge className="ml-auto tabular-nums" aria-label={`${counts.pendingListings} pending listings`}>
                  {counts.pendingListings}
                </Badge>
              )}
              {href === '/moderator/avatars' && counts.pendingAvatars > 0 && (
                <Badge className="ml-auto tabular-nums" aria-label={`${counts.pendingAvatars} pending avatar reviews`} title="Pending avatar reviews">
                  {counts.pendingAvatars}
                </Badge>
              )}
            </Link>
          )
        })}
      <LogoutButton />
    </nav>
  )
}
