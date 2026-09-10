import { Skeleton } from '@/components/ui/skeleton'

export function CategorySectionSkeleton() {
  return (
    <section className="flex flex-col gap-6">
      <Skeleton className="h-6 w-40" />

      <div className="flex gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-56 shrink-0 rounded-lg" />
        ))}
      </div>
    </section>
  )
}
