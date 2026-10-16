import { Skeleton } from '@/components/ui/skeleton'
import { ConversationSkeleton } from '@/features/messages/conversation-skeleton'
import { LoadingStatus } from '@/shared/ui/loading-status'

type Variant = 'queue' | 'dashboard' | 'profiles' | 'listing' | 'conversation'

function QueueRowSkeleton() {
  return (
    <div className="bg-card flex min-w-0 flex-wrap items-center gap-4 rounded-xl border p-4">
      <Skeleton className="size-16 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="ml-auto h-8 w-24" />
    </div>
  )
}

export function ModerationLoading({ variant = 'queue' }: { variant?: Variant }) {
  return (
    <LoadingStatus label={variant === 'conversation' ? 'Loading conversation review' : 'Loading moderation content'} className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-5 w-full" />
      </div>
      {variant === 'dashboard' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="bg-card space-y-6 rounded-xl border p-6">
              <Skeleton className="size-5" />
              <Skeleton className="h-11 w-3/4" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-8 w-32 max-w-full" />
            </div>
          ))}
        </div>
      ) : variant === 'listing' ? (
        <>
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-6">
              <Skeleton className="aspect-4/3 rounded-2xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <div className="bg-card space-y-5 rounded-xl border p-6">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : variant === 'conversation' ? (
        <>
          <div className="bg-card space-y-4 rounded-xl border p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-5 w-4/5" />
            ))}
            <Skeleton className="h-9 w-40 max-w-full" />
          </div>
          <ConversationSkeleton readOnly />
        </>
      ) : (
        <Skeleton className="h-9 w-full" />
      )}
      {variant === 'profiles' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="bg-card space-y-5 rounded-xl border p-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="space-y-3 border-y py-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="flex flex-wrap gap-6">
                <Skeleton className="size-24 rounded-full" />
                <Skeleton className="size-24 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : (
        (variant === 'queue' || variant === 'dashboard') && (
          <div aria-hidden="true" className="space-y-4">
            {[0, 1, 2].map((index) => (
              <QueueRowSkeleton key={index} />
            ))}
          </div>
        )
      )}
    </LoadingStatus>
  )
}

export function ModeratorShellSkeleton() {
  return (
    <div className="container flex min-w-0 flex-col gap-8 py-10">
      <div className="space-y-2 border-b pb-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-52 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <div className="bg-card grid gap-1 rounded-xl border p-2 sm:grid-cols-2 lg:grid-cols-1">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
        <ModerationLoading />
      </div>
    </div>
  )
}
