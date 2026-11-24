import { getLocale, getMessages } from 'next-intl/server'
import { Suspense } from 'react'
import { AccountShellSkeleton } from '@/features/account/account-skeleton'
import { ClientMessages } from '@/i18n/client-messages'
import { requireMarketplaceUser } from '@/lib/auth-utils'
import { privateMetadata } from '@/lib/metadata'

async function MarketplaceGuard({ children }: { children: React.ReactNode }) {
  await requireMarketplaceUser(await getLocale())
  return <div className="container py-10">{children}</div>
}

export const metadata = privateMetadata

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  return (
    <ClientMessages
      locale={locale}
      messages={{
        Workspace: messages.Workspace,
        Listing: messages.Listing,
        Search: messages.Search,
        Attributes: messages.Attributes,
        Locations: messages.Locations,
        CategoryNames: messages.CategoryNames
      }}
    >
      <Suspense
        fallback={
          <div className="container py-10">
            <AccountShellSkeleton />
          </div>
        }
      >
        <MarketplaceGuard>{children}</MarketplaceGuard>
      </Suspense>
    </ClientMessages>
  )
}
