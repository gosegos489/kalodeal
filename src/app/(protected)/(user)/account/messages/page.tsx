import { Suspense } from 'react'
import { MessagesHeading, MessagesLoading, type MessagesPageProps, MessagesScreen } from '@/features/messages/messages-screen'

export default function MessagesPage(props: MessagesPageProps) {
  return (
    <section aria-labelledby="messages-heading" className="flex flex-col gap-6">
      <MessagesHeading />
      <Suspense fallback={<MessagesLoading />}>
        <MessagesScreen {...props} />
      </Suspense>
    </section>
  )
}
