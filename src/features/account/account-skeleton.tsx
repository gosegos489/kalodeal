import { Skeleton } from '@/components/ui/skeleton'

export function AccountContentSkeleton() {
  return (
    <div role="status" aria-label="Loading account content" className="flex flex-col gap-6">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-8 w-56 max-w-full motion-reduce:animate-none" />
          <Skeleton className="h-4 w-64 max-w-full motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-9 w-36 motion-reduce:animate-none" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="bg-card flex flex-col gap-6 rounded-xl border p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-full motion-reduce:animate-none" />
              <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-9 w-20 motion-reduce:animate-none" />
            <Skeleton className="h-9 w-32 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading account content...</span>
    </div>
  )
}

export function AccountShellSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div aria-hidden="true" className="flex flex-col gap-2 border-b pb-6">
        <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
        <Skeleton className="h-9 w-52 motion-reduce:animate-none sm:h-10" />
        <Skeleton className="h-5 w-80 max-w-full motion-reduce:animate-none" />
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <div aria-hidden="true">
          <Skeleton className="h-12 w-full motion-reduce:animate-none lg:hidden" />
          <div className="bg-card hidden flex-col gap-1 rounded-xl border p-2 lg:flex">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="flex h-11 items-center gap-3 px-3">
                <Skeleton className="size-4 shrink-0 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <AccountContentSkeleton />
        </div>
      </div>
    </div>
  )
}
