import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ModerationLoading } from '@/features/moderation/moderation-loading'
import { ModeratorShell } from '@/features/moderation/moderator-shell'
import { requireModerator } from '@/lib/auth-utils'

export const metadata: Metadata = { robots: { index: false, follow: false } }

async function ModeratorGuard({ children }: { children: React.ReactNode }) {
  await requireModerator()

  return <ModeratorShell>{children}</ModeratorShell>
}

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container py-10">
          <ModerationLoading />
        </div>
      }
    >
      <ModeratorGuard>{children}</ModeratorGuard>
    </Suspense>
  )
}
