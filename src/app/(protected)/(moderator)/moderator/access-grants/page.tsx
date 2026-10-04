import { Suspense } from 'react'
import { AccessGrantUsers } from '@/features/access-grants/users'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'

async function Users({ searchParams }: { searchParams: Promise<ModerationSearchParams> }) {
  return <AccessGrantUsers {...await searchParams} />
}

export default function AccessGrantsPage(props: { searchParams: Promise<ModerationSearchParams> }) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Users {...props} />
    </Suspense>
  )
}
