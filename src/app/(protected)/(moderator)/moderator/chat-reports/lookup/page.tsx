import { Suspense } from 'react'
import { ConversationLookup } from '@/features/moderation/conversation-lookup'
import { ModerationLoading } from '@/features/moderation/moderation-loading'
import type { ModerationSearchParams } from '@/features/moderation/search'

type Props = { searchParams: Promise<ModerationSearchParams> }
async function Lookup({ searchParams }: Props) {
  return <ConversationLookup {...await searchParams} />
}
export default function ConversationLookupPage(props: Props) {
  return (
    <Suspense fallback={<ModerationLoading />}>
      <Lookup {...props} />
    </Suspense>
  )
}
