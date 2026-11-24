import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingGridSkeleton } from '@/entities/listing/ui/listing-skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function SellerProfileSkeleton() {
  const t = useTranslations('Sellers')
  return (
    <LoadingStatus label={t('loading')} className="space-y-8">
      <Skeleton className="h-5 w-48 max-w-full" />
      <div aria-hidden="true" className="bg-card space-y-6 rounded-xl border p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
          <div className="w-full space-y-3">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div aria-hidden="true" className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-9 w-28 lg:w-full" />
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <Skeleton className="h-7 w-32" />
          <ListingGridSkeleton count={3} className="gap-5 md:grid-cols-2 xl:grid-cols-3" />
        </div>
      </div>
    </LoadingStatus>
  )
}
