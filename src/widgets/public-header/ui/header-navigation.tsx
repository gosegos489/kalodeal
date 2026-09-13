'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Browse', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'How it works', href: '/how-it-works' }
]

export default function HeaderNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex items-center gap-7 text-sm">
        {navigation.map((item) => {
          const route = item.href.split('#')[0]
          const isActive = item.href.includes('#') ? false : route === '/' ? pathname === '/' : pathname.startsWith(route)

          return (
            <li key={item.label}>
              <Link
                className={cn('text-muted-foreground hover:text-foreground transition-colors', isActive && 'text-primary font-semibold')}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
