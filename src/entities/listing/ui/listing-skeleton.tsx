import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function ListingCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-xs">
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-7 w-2/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex justify-between gap-3 border-t pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

export function ListingGridSkeleton({ className, count = 4 }: { className?: string; count?: number }) {
  return (
    <div className={cn('grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ListingRowsSkeleton({ label = 'Loading listings' }: { label?: string }) {
  return (
    <LoadingStatus label={label} className="flex flex-col gap-4">
      <Skeleton className="h-5 w-64 max-w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="bg-card grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border p-3 sm:p-4 xl:grid-cols-[64px_minmax(0,1fr)_auto_auto] xl:gap-4"
        >
          <Skeleton className="row-span-2 size-16 rounded-lg xl:row-span-1" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="col-start-2 h-5 w-20 xl:col-start-auto" />
          <div className="col-span-2 flex flex-wrap justify-end gap-2 border-t pt-3 xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </LoadingStatus>
  )
}

export function ListingDetailSkeleton() {
  return (
    <LoadingStatus label="Loading listing" className="flex flex-col gap-6">
      <Skeleton className="h-5 w-64 max-w-full" />
      <div aria-hidden="true" className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <div className="min-w-0 space-y-3">
            <Skeleton className="aspect-4/3 rounded-2xl" />
            <div className="flex gap-3 overflow-hidden p-1">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="size-20 shrink-0 rounded-lg" />
              ))}
            </div>
          </div>
          {[0, 1].map((index) => (
            <div key={index} className="bg-card order-3 space-y-4 rounded-xl border p-6 lg:order-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-0 lg:col-start-2 lg:row-start-1">
          <div className="bg-card space-y-4 rounded-xl border p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="bg-card space-y-5 rounded-xl border p-6">
            <Skeleton className="h-5 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-14 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  )
}
