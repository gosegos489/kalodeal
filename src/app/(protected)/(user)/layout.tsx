import type { Metadata } from 'next'
import { Suspense } from 'react'
import { requireMarketplaceUser } from '@/lib/auth-utils'

export const metadata: Metadata = {
  robots: {
    index: false
  }
}

async function MarketplaceGuard({ children }: { children: React.ReactNode }) {
  await requireMarketplaceUser()
  return <div className="container py-10">{children}</div>
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container py-10" role="status">
          Loading account…
        </div>
      }
    >
      <MarketplaceGuard>{children}</MarketplaceGuard>
    </Suspense>
  )
}
