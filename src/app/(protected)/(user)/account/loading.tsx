import { Skeleton } from '@/components/ui/skeleton'

export default function AccountLoading() {
  return (
    <div role="status" aria-label="Loading account content" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <span className="sr-only">Loading account content...</span>
    </div>
  )
}
