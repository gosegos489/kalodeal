import { ChatProvider } from '@/app/chat-provider'
import { ChatStatus } from '@/widgets/chat/chat-status'

export default function MessagesPage() {
  return (
    <ChatProvider>
      <ChatStatus />
    </ChatProvider>
  )
}
