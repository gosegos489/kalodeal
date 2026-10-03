import { Suspense } from 'react'
import { MessagesLoading, type MessagesPageProps, MessagesScreen } from '@/features/messages/messages-screen'

export default function ConversationPage(props: MessagesPageProps & { params: Promise<{ conversationId: string }> }) {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesScreen {...props} />
    </Suspense>
  )
}
