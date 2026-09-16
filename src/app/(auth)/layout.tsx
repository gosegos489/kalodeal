import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireGuest } from '@/lib/auth-utils'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
}

async function GuestGuard({ children }: { children: React.ReactNode }) {
  await requireGuest()

  return children
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <GuestGuard>{children}</GuestGuard>
    </Suspense>
  )
}
