import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarModerationQueue } from '@/features/account/settings/avatar-moderation-queue'

async function Moderation({ searchParams }: { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }) {
  const { page, q } = await searchParams
  return <AvatarModerationQueue page={page} q={q} />
}

export default function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }) {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-64" />}>
      <Moderation searchParams={searchParams} />
    </Suspense>
  )
}
