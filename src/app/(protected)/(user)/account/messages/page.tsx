import { Suspense } from 'react'
import { MessagesLoading, type MessagesPageProps, MessagesScreen } from '@/features/messages/messages-screen'

export default function MessagesPage(props: MessagesPageProps) {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesScreen {...props} />
    </Suspense>
  )
}
