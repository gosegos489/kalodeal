import { Skeleton } from '@/components/ui/skeleton'

export function HeroLoading() {
  return (
    <div role="status" aria-label="Loading search" className="max-w-5xl">
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="mt-3 h-6 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-48 w-full rounded-2xl sm:mt-8 sm:h-20" />
    </div>
  )
}

export function HomeLoading() {
  return (
    <div role="status" aria-label="Loading search, listings and categories">
      <HeroLoading />
      <div className="mt-12 sm:mt-16">
        <ListingsLoading />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
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
