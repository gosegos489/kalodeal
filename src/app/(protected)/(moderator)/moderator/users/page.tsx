import { Suspense } from 'react'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'
import { ModerationUsers } from '@/features/moderation/users/moderation-users'

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
