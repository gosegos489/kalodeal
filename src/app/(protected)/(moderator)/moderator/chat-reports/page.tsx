import { Suspense } from 'react'
import { ChatReportQueue } from '@/features/moderation/chat-report-queue'
import { ModerationLoading } from '@/features/moderation/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/search'

type Props = { searchParams: Promise<ModerationSearchParams> }
async function Queue({ searchParams }: Props) {
  return <ChatReportQueue {...await searchParams} />
}
export default function ChatReportsPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Queue {...props} />
    </Suspense>
  )
}
