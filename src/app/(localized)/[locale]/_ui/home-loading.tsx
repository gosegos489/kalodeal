import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingGridSkeleton } from '@/entities/listing/ui/listing-skeleton'
import { ListingSearchSkeleton } from '@/features/listing-search/ui/listing-search-skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function HeroLoading() {
  return (
    <div className="bg-card min-w-0 rounded-2xl border p-4 shadow-sm sm:p-6">
      <div className="mb-5 space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <ListingSearchSkeleton />
    </div>
  )
}

export function HomeLoading() {
  const t = useTranslations('Home')
  return (
    <div className="flex min-w-0 flex-col gap-12 sm:gap-16">
      <LoadingStatus label={t('loadingCategories')} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-card flex flex-col items-center gap-3 rounded-xl border p-4">
            <Skeleton className="size-12 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </LoadingStatus>
      <HeroLoading />
      <ListingsLoading />
    </div>
  )
}

export function ListingsLoading() {
  const t = useTranslations('Home')
  return (
    <LoadingStatus label={t('loadingListings')} className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8">
      <div aria-hidden="true" className="bg-card hidden space-y-5 rounded-2xl border p-5 lg:block">
        <Skeleton className="h-6 w-24" />
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="min-w-0">
        <Skeleton className="mb-4 h-11 w-24 lg:hidden" />
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <ListingGridSkeleton className="md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" />
      </div>
    </LoadingStatus>
  )
}
