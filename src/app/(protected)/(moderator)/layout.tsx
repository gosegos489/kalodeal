import type { Metadata } from 'next'
import { getMessages } from 'next-intl/server'
import { Suspense } from 'react'
import { ModeratorShell } from '@/features/moderation/moderator-shell'
import { ModeratorShellSkeleton } from '@/features/moderation/shared/moderation-loading'
import { ClientMessages } from '@/i18n/client-messages'
import { canManageCategoryIcons, canManageLegalDocuments } from '@/lib/auth-permissions'
import { requireModerator } from '@/lib/auth-utils'

export const metadata: Metadata = { robots: { index: false, follow: false } }

async function ModeratorGuard({ children }: { children: React.ReactNode }) {
  const session = await requireModerator()
  const messages = await getMessages({ locale: 'en' })

  return (
    // Shared listing fields use next-intl; moderation always stays in English.
    <ClientMessages
      locale="en"
      messages={{
        Workspace: messages.Workspace,
        Listing: messages.Listing,
        Search: messages.Search,
        Attributes: messages.Attributes,
        Locations: messages.Locations
      }}
    >
      <ModeratorShell canEditCategoryIcons={canManageCategoryIcons(session.user.role)} canEditLegal={canManageLegalDocuments(session.user.role)}>
        {children}
      </ModeratorShell>
    </ClientMessages>
  )
}

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ModeratorShellSkeleton />}>
      <ModeratorGuard>{children}</ModeratorGuard>
    </Suspense>
  )
}
