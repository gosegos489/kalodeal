import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarModerationQueue } from '@/features/account/settings/avatar-moderation-queue'

async function Moderation({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page } = await searchParams
  return <AvatarModerationQueue page={page} />
}

export default function ModeratorPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-64" />}>
      <Moderation searchParams={searchParams} />
    </Suspense>
  )
}
