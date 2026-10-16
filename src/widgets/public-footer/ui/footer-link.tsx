'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { stripLocale } from '@/i18n/routing'

type Props = {
  href: string
  label: string
}

export default function FooterLink({ href, label }: Props) {
  const pathname = stripLocale(usePathname())
  const target = stripLocale(href)
  const isActive = target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(`${target}/`)

  return (
    <Link href={href} className={`hover:text-primary transition-colors ${isActive ? 'text-primary' : ''}`}>
      {label}
    </Link>
  )
}
