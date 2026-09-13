import { Suspense } from 'react'
import { requireModerator } from '@/lib/auth-utils'

async function ModeratorGuard({ children }: { children: React.ReactNode }) {
  await requireModerator()

  return children
}

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ModeratorGuard>{children}</ModeratorGuard>
    </Suspense>
  )
}
