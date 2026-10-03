import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireGuest } from '@/lib/auth-utils'
import { privateMetadata } from '@/lib/metadata'

export const metadata: Metadata = privateMetadata

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
