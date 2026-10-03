import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireUser } from '@/lib/auth-utils'
import { privateMetadata } from '@/lib/metadata'

export const metadata: Metadata = privateMetadata

async function ProtectedGuard({ children }: { children: React.ReactNode }) {
  await requireUser()

  return children
}

export default function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={null}>
      <ProtectedGuard>{children}</ProtectedGuard>
    </Suspense>
  )
}
