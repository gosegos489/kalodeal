import { Suspense } from 'react'
import type { GrantHistoryParams } from '@/features/access-grants/data'
import { UserAccessReview } from '@/features/access-grants/user-access-review'
import { ModerationLoading } from '@/features/moderation/moderation-loading'

type Props = { params: Promise<{ userId: string }>; searchParams: Promise<GrantHistoryParams> }

async function Review(props: Props) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams])
  return <UserAccessReview userId={params.userId} params={searchParams} />
}

export default function AccessGrantUserPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Review {...props} />
    </Suspense>
  )
}
