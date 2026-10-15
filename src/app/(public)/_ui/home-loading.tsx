import { Skeleton } from '@/components/ui/skeleton'

export function HeroLoading() {
  return (
    <div role="status" aria-label="Loading search">
      <Skeleton className="h-80 w-full rounded-2xl sm:h-64" />
    </div>
  )
}

export function HomeLoading() {
  return (
    <div role="status" aria-label="Loading search, listings and categories">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="mt-12 sm:mt-16"><HeroLoading /></div>
      <div className="mt-12 sm:mt-16"><ListingsLoading /></div>
    </div>
  )
}

export function ListingsLoading() {
  return (
    <div role="status" aria-label="Loading listings" className="flex flex-col gap-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
