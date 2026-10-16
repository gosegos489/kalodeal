import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ModeratorShell } from '@/features/moderation/moderator-shell'
import { ModeratorShellSkeleton } from '@/features/moderation/shared/moderation-loading'
import { canManageCategoryIcons, canManageLegalDocuments } from '@/lib/auth-permissions'
import { requireModerator } from '@/lib/auth-utils'

export const metadata: Metadata = { robots: { index: false, follow: false } }

async function ModeratorGuard({ children }: { children: React.ReactNode }) {
  const session = await requireModerator()

  return (
    <ModeratorShell canEditCategoryIcons={canManageCategoryIcons(session.user.role)} canEditLegal={canManageLegalDocuments(session.user.role)}>
      {children}
    </ModeratorShell>
  )
}

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ModeratorShellSkeleton />}>
      <ModeratorGuard>{children}</ModeratorGuard>
    </Suspense>
  )
}
