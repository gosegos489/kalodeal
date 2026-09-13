import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth-utils'

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return children
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  )
}
