import { ChatProvider } from '@/app/chat-provider'
import { ChatStatus } from '@/widgets/chat/ChatStatus'

export default function MessagesPage() {
  return (
    <ChatProvider>
      <ChatStatus />
    </ChatProvider>
  )
}
