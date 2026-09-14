'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  href: string
  label: string
}

export default function FooterLink({ href, label }: Props) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link href={href} className={`hover:text-primary transition-colors ${isActive ? 'text-primary' : ''}`}>
      {label}
    </Link>
  )
}
