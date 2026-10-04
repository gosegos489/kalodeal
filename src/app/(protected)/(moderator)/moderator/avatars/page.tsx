import { Suspense } from 'react'
import { AvatarModerationQueue } from '@/features/account/settings/avatar-moderation-queue'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

type Props = { searchParams: Promise<{ page?: string | string[]; q?: string | string[] }> }

async function Queue({ searchParams }: Props) {
  const { page, q } = await searchParams
  return <AvatarModerationQueue page={page} q={q} embedded />
}

export default function ModeratorAvatarsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Queue searchParams={searchParams} />
    </Suspense>
  )
}
