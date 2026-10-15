import { Suspense } from 'react'
import { CategoryIconQueue } from '@/features/moderation/categories/category-icon-queue'
import type { CategoryIconSearchParams } from '@/features/moderation/categories/data'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

async function Categories({ searchParams }: { searchParams: Promise<CategoryIconSearchParams> }) {
  return <CategoryIconQueue {...await searchParams} />
}

export default function CategoryIconsPage({ searchParams }: { searchParams: Promise<CategoryIconSearchParams> }) {
  return <Suspense fallback={<ModerationLoading />}><Categories searchParams={searchParams} /></Suspense>
}
