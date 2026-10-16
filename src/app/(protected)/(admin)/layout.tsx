import { Suspense } from 'react'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'
import { requireAdmin } from '@/lib/auth-utils'

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return children
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl py-8">
          <ModerationLoading variant="profiles" />
        </div>
      }
    >
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  )
}
