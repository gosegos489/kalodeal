import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function AccountPlanSkeleton() {
  const t = useTranslations('Workspace')

  return (
    <LoadingStatus label={t('loadingYourCurrentPlan')} className="bg-card space-y-6 rounded-xl border p-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-48 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-4/5" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </LoadingStatus>
  )
}

export function AccountAnalyticsSkeleton() {
  const t = useTranslations('Workspace')

  return (
    <LoadingStatus label={t('loadingListingAnalytics')} className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-card space-y-6 rounded-xl border p-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-card space-y-5 rounded-xl border p-6">
        <Skeleton className="h-6 w-48 max-w-full" />
        <Skeleton className="h-5 w-full" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-8 w-24" />
          ))}
        </div>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="grid grid-cols-[minmax(0,2fr)_1fr_1fr] gap-4 border-b py-3 last:border-0">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </LoadingStatus>
  )
}

export function AccountSettingsSkeleton() {
  const t = useTranslations('Workspace')

  return (
    <LoadingStatus label={t('loadingAccountSettings')} className="grid gap-6 xl:grid-cols-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="bg-card flex min-w-0 flex-col gap-6 rounded-xl border p-6">
          <div className="space-y-2 border-b pb-6">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          {index === 0 && <Skeleton className="size-24 rounded-full" />}
          {Array.from({ length: index === 1 ? 1 : 3 }, (_, field) => (
            <div key={field} className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="mt-auto h-9 w-32" />
        </div>
      ))}
    </LoadingStatus>
  )
}

export function AccountContentSkeleton() {
  const t = useTranslations('Workspace')

  return (
    <div role="status" aria-label={t('loadingAccountContent')} className="flex flex-col gap-6">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-8 w-56 max-w-full motion-reduce:animate-none" />
          <Skeleton className="h-4 w-64 max-w-full motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-9 w-36 motion-reduce:animate-none" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="bg-card flex flex-col gap-6 rounded-xl border p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-full motion-reduce:animate-none" />
              <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-9 w-20 motion-reduce:animate-none" />
            <Skeleton className="h-9 w-32 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('loadingAccountContent175')}</span>
    </div>
  )
}

export function AccountShellSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div aria-hidden="true" className="flex flex-col gap-2 border-b pb-6">
        <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
        <Skeleton className="h-9 w-52 motion-reduce:animate-none sm:h-10" />
        <Skeleton className="h-5 w-80 max-w-full motion-reduce:animate-none" />
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <div aria-hidden="true">
          <Skeleton className="h-12 w-full motion-reduce:animate-none lg:hidden" />
          <div className="bg-card hidden flex-col gap-1 rounded-xl border p-2 lg:flex">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="flex h-11 items-center gap-3 px-3">
                <Skeleton className="size-4 shrink-0 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <AccountContentSkeleton />
        </div>
      </div>
    </div>
  )
}
