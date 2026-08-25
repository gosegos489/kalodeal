import { ChatProvider } from '@/app/chat-provider'

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>
}
