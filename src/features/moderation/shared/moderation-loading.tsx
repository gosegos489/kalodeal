import { Skeleton } from '@/components/ui/skeleton'

export function ModerationLoading() {
  return (
    <div role="status" aria-label="Loading moderation content" className="flex min-w-0 flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <span className="sr-only">Loading moderation content...</span>
    </div>
  )
}
