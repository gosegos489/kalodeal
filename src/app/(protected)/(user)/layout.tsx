import { Suspense } from 'react'
import { AccountShellSkeleton } from '@/features/account/account-skeleton'
import { requireMarketplaceUser } from '@/lib/auth-utils'

async function MarketplaceGuard({ children }: { children: React.ReactNode }) {
  await requireMarketplaceUser()
  return <div className="container py-10">{children}</div>
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container py-10">
          <AccountShellSkeleton />
        </div>
      }
    >
      <MarketplaceGuard>{children}</MarketplaceGuard>
    </Suspense>
  )
}
