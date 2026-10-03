import { Suspense } from 'react'
import { ModerationLoading } from '@/features/moderation/moderation-loading'
import { ModerationUsers } from '@/features/moderation/moderation-users'
import type { ModerationSearchParams } from '@/features/moderation/search'

type Props = { searchParams: Promise<ModerationSearchParams> }

async function Users({ searchParams }: Props) {
  return <ModerationUsers {...await searchParams} />
}

export default function ModeratorUsersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Users searchParams={searchParams} />
    </Suspense>
  )
}
