import { Suspense } from 'react'
import { ChatReportReview } from '@/features/moderation/chat-report-review'
import { ModerationLoading } from '@/features/moderation/moderation-loading'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string | string[] }> }
async function Review({ params, searchParams }: Props) {
  const [{ id }, { before }] = await Promise.all([params, searchParams])
  return <ChatReportReview id={id} before={before} />
}
export default function ChatReportPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Review {...props} />
    </Suspense>
  )
}
