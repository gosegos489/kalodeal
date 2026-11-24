import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LoadingStatus } from '@/shared/ui/loading-status'

export function ConversationSkeleton({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <div aria-hidden="true" className="bg-card flex min-h-96 min-w-0 flex-col rounded-xl border">
      <div className={cn('grid gap-3 border-b p-4', readOnly && 'sm:grid-cols-2')}>
        {Array.from({ length: readOnly ? 2 : 1 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className={cn('h-14 w-2/3 rounded-2xl', index % 2 === 1 && 'self-end')} />
        ))}
      </div>
      {!readOnly && (
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      )}
    </div>
  )
}

export function ConversationLoading() {
  const t = useTranslations('Workspace')

  return (
    <LoadingStatus label={t('loadingConversationHistory')}>
      <ConversationSkeleton readOnly />
    </LoadingStatus>
  )
}
