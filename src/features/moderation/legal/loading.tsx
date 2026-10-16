import { Skeleton } from '@/components/ui/skeleton'

export function LegalEditorSkeleton() {
  return (
    <div className="min-w-0 space-y-4" role="status" aria-label="Loading legal editor">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-9 w-32" />
    </div>
  )
}
