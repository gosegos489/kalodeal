import { Suspense } from 'react'
import { ChatReportQueue } from '@/features/moderation/chat-reports/chat-report-queue'
import { ModerationLoading } from '@/features/moderation/shared/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'

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
