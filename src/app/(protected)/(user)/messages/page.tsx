import { MessageCircle } from 'lucide-react'
import { ChatProvider } from '@/app/chat-provider'
import { AccountPlaceholder } from '@/features/account/account-placeholder'
import { ChatStatus } from '@/widgets/chat/chat-status'

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountPlaceholder title="Messages" description="Private conversations with buyers and sellers are not available yet." icon={MessageCircle} />
      <ChatProvider>
        <ChatStatus />
      </ChatProvider>
    </div>
  )
}
