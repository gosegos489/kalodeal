import { getTranslations } from 'next-intl/server'
import { Skeleton } from '@/components/ui/skeleton'

export default async function Loading() {
  const t = await getTranslations('Legal')
  return (
    <div className="container space-y-6 py-12" role="status" aria-label={t('loading')}>
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-5 w-56 max-w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-4" aria-hidden="true">
          <Skeleton className="h-7 w-48 max-w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
