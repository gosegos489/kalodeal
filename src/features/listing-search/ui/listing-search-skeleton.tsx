import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function ListingSearchSkeleton() {
  return (
    <LoadingStatus label="Loading search controls" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 sm:w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </LoadingStatus>
  )
}
