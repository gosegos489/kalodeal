import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { ChatMessageList, type ChatParticipant, ChatParticipantHeader } from '@/features/messages/chat-presentation'
import { requireModerator } from '@/lib/auth-utils'
import { chatReports } from './chat-report-server'
import { ChatReportError } from './chat-report-workflow'

export async function ModeratorConversationHistory({
  conversationId,
  before,
  href
}: {
  conversationId: string
  before?: string | string[]
  href: string
}) {
  await requireModerator()
  let history
  try {
    history = await chatReports.getHistory({ conversationId, ...(before === undefined ? {} : { before }) })
  } catch (error) {
    if (!(error instanceof ChatReportError)) throw error
    return (
      <p role="alert" className="text-destructive">
        Invalid history page.{' '}
        <Link href={href} className="underline">
          Show latest messages
        </Link>
      </p>
    )
  }
  const { buyer, seller, buyerReadSequence, sellerReadSequence } = history.conversation
  const participants: ChatParticipant[] = [
    { id: buyer.id, name: getSellerName(buyer.name), avatar: getApprovedAvatarUrl(buyer.id, buyer.image), role: 'Buyer' },
    { id: seller.id, name: getSellerName(seller.name), avatar: getApprovedAvatarUrl(seller.id, seller.image), role: 'Seller' }
  ]
  return (
    <section className="bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-4" aria-label="Conversation history">
      <h3 className="text-lg font-semibold">Conversation history</h3>
      <p className="text-muted-foreground text-sm">Read-only snapshot. Reviewing does not mark participants’ messages as read.</p>
      <div className="grid min-w-0 gap-3 border-b pb-4 sm:grid-cols-2">
        {participants.map((participant) => (
          <ChatParticipantHeader key={participant.id} participant={participant} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {history.hasMore && (
          <Button nativeButton={false} variant="outline" render={<Link href={`${href}?before=${history.nextBefore}`} />}>
            Load older messages
          </Button>
        )}
        {before !== undefined && (
          <Button nativeButton={false} variant="outline" render={<Link href={href} />}>
            Latest messages
          </Button>
        )}
      </div>
      {history.messages.length ? (
        <ChatMessageList
          messages={history.messages.map((message) => ({
            id: message.id,
            senderId: message.sender.id,
            content: message.content,
            sequence: message.sequence,
            createdAt: message.createdAt.toISOString()
          }))}
          participants={participants}
          rightSenderId={seller.id}
          readBySender={{ [buyer.id]: sellerReadSequence, [seller.id]: buyerReadSequence }}
          reference={new Date().toISOString()}
          showLabels
        />
      ) : (
        <p className="text-muted-foreground text-sm">No messages on this page.</p>
      )}
    </section>
  )
}
