import { Suspense } from 'react'
import { requireUser } from '@/lib/auth-utils'

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
