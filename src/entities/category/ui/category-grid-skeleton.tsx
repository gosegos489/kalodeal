import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function CategoryGridSkeleton() {
  return (
    <LoadingStatus label="Loading categories" className="space-y-4">
      <div className="flex flex-wrap justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            aria-hidden="true"
            className="bg-card grid overflow-hidden rounded-xl border sm:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)]"
          >
            <div className="flex flex-col items-center gap-4 p-6">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4 border-t p-4 sm:border-t-0 sm:border-l">
              <Skeleton className="h-4 w-28" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-5 w-full" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingStatus>
  )
}
