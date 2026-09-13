'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from '../mocks/mocks'

export default function HeaderNavigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:block">
      <ul className="flex items-center gap-7 text-sm">
        {navigation.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <li key={item.label}>
              <Link className={`hover:text-primary transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} href={item.href}>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
