import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { requireUser } from '@/lib/auth-utils'
import { privateMetadata, rootMetadata } from '@/lib/metadata'
import { LoadingStatus } from '@/shared/ui/loading-status'
import { SiteDocument } from '@/shared/ui/site-document'

export const metadata: Metadata = { ...rootMetadata, ...privateMetadata }

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
    <SiteDocument>
      <Suspense
        fallback={
          <LoadingStatus label="Loading your workspace" className="container space-y-6 py-10">
            <Skeleton className="h-9 w-52 max-w-full" />
            <Skeleton className="h-5 w-80 max-w-full" />
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <Skeleton className="h-12 rounded-xl lg:h-96" />
              <div className="space-y-4">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            </div>
          </LoadingStatus>
        }
      >
        <ProtectedGuard>{children}</ProtectedGuard>
      </Suspense>
    </SiteDocument>
  )
}
