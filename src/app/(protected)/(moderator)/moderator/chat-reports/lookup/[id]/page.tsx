import { Suspense } from 'react'
import { ConversationLookupReview } from '@/features/moderation/chat-reports/conversation-lookup'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string | string[] }> }
async function Review({ params, searchParams }: Props) {
  const [{ id }, { before }] = await Promise.all([params, searchParams])
  return <ConversationLookupReview id={id} before={before} />
}
export default function ConversationLookupReviewPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Review {...props} />
    </Suspense>
  )
}
