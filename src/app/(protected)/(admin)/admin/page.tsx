import { Suspense } from 'react'
import { AvatarModerationQueue } from '@/features/account/settings/avatar-moderation-queue'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

async function Moderation({ searchParams }: { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }) {
  const { page, q } = await searchParams
  return <AvatarModerationQueue page={page} q={q} />
}

export default function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }) {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl py-8">
          <ModerationLoading variant="profiles" />
        </div>
      }
    >
      <Moderation searchParams={searchParams} />
    </Suspense>
  )
}
