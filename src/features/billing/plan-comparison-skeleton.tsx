import { getTranslations } from 'next-intl/server'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'
import { pricingCtaClassName } from './pricing-cta'

export async function PlanComparisonSkeleton() {
  const t = await getTranslations('Pricing')
  return (
    <LoadingStatus label={t('loading')} className="space-y-6">
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} aria-hidden="true" className="bg-card flex flex-col gap-6 rounded-xl border p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-full" />
              {index === 3 && <Skeleton className="h-5 w-2/3" />}
            </div>
            <Skeleton className="h-9 w-3/4" />
            <div className="space-y-3">
              {Array.from({ length: index === 3 ? 10 : 6 }, (_, line) => (
                <Skeleton key={line} className={line % 3 === 2 ? 'h-5 w-3/4' : 'h-5 w-full'} />
              ))}
            </div>
            <div className="mt-auto pt-2">
              <Skeleton className={pricingCtaClassName} />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
    </LoadingStatus>
  )
}
