'use client'

import { usePathname } from 'next/navigation'
import { Fragment, type ReactNode, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

function CurrentRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Remount the route subtree so Next.js Activity cannot retain headings from
  // previous pages in the DOM. Query-only search updates keep the same subtree.
  return <Fragment key={pathname}>{children}</Fragment>
}

export function RouteContent({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading page" className="container py-8 sm:py-10">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
          <span className="sr-only">Loading page...</span>
        </div>
      }
    >
      <CurrentRoute>{children}</CurrentRoute>
    </Suspense>
  )
}
