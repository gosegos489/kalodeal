'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from '../mocks/mocks'

type NavigationLinksProps = {
  mobile?: boolean
  onNavigate?: () => void
}

export function NavigationLinks({ mobile = false, onNavigate }: NavigationLinksProps) {
  const pathname = usePathname()

  return (
    <ul className={mobile ? 'flex flex-col gap-1' : 'flex items-center gap-7 text-sm'}>
      {navigation.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <li key={item.label}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={
                mobile
                  ? `flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`
                  : `transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function HeaderNavigation() {
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <NavigationLinks />
    </nav>
  )
}
