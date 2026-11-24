import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LoadingStatus } from '@/shared/ui/loading-status'
import { ConversationSkeleton } from './conversation-skeleton'

export function MessagesLoading({ selected = false }: { selected?: boolean }) {
  const t = useTranslations('Workspace')

  return (
    <LoadingStatus label={t('loadingMessages')} className="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <div aria-hidden="true" className={cn('bg-card min-w-0 divide-y rounded-xl border', selected && 'hidden xl:block')}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className={cn('min-w-0', !selected && 'hidden xl:block')}>
        <ConversationSkeleton />
      </div>
    </LoadingStatus>
  )
}

export function MessagesHeading() {
  const t = useTranslations('Workspace')

  return (
    <div>
      <h2 id="messages-heading" className="text-2xl font-semibold">
        {t('messages')}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">{t('privateConversationsAboutYourListingsAndPurchases')}</p>
    </div>
  )
}
