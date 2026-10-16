import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function ListingFormSkeleton() {
  return (
    <LoadingStatus label="Loading listing form" className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
      <div aria-hidden="true" className="space-y-6 lg:col-span-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="bg-card space-y-6 rounded-2xl border p-5 sm:p-7">
          <div className="space-y-2 border-b pb-5">
            <Skeleton className="h-7 w-48 max-w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
        <div className="bg-card space-y-6 rounded-2xl border p-5 sm:p-7">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
      <div aria-hidden="true" className="bg-card space-y-5 rounded-2xl border p-5">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </LoadingStatus>
  )
}
