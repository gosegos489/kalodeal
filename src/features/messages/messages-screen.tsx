import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { ChatView } from './chat-view'
import { formatConversationTime, formatUnreadBadge } from './format-time'
import { MessagesRealtime } from './realtime'
import { getMyConversation, getMyConversations } from './server'
import { ConversationAvatar } from './use-participant-presence'
import { MessagingError } from './workflow'

export type MessagesPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export function MessagesLoading() {
  return (
    <div role="status" aria-label="Loading messages" className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

export async function MessagesScreen({ searchParams, params }: MessagesPageProps & { params?: Promise<{ conversationId: string }> }) {
  const [query, route] = await Promise.all([searchParams, params])
  const selected = route?.conversationId
  const reference = new Date().toISOString()
  let list
  let detail
  try {
    const loaded = await Promise.all([getMyConversations(query.page), selected ? getMyConversation(selected) : Promise.resolve(null)])
    list = loaded[0]
    detail = loaded[1]
  } catch (error) {
    if (error instanceof MessagingError && error.status === 401) redirect('/login')
    if (error instanceof MessagingError && error.status === 404) notFound()
    throw error
  }

  return (
    <section aria-labelledby="messages-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="messages-heading" className="text-2xl font-semibold">
          Messages
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Private conversations about your listings and purchases.</p>
      </div>
      <MessagesRealtime conversationId={selected} otherId={detail?.otherId}>
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside aria-label="Conversations" className={cn('bg-card min-w-0 rounded-xl border', selected && 'hidden xl:block')}>
            {!list.conversations.length ? (
              <div className="text-muted-foreground flex flex-col items-center gap-3 p-6 text-center text-sm">
                <MessageCircle aria-hidden="true" className="size-8" />
                <p>No conversations yet. Open a listing and choose Message seller to get started.</p>
                <Link href="/" className="text-primary underline">
                  Browse listings
                </Link>
              </div>
            ) : (
              <ul className="divide-y">
                {list.conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/account/messages/${conversation.id}?page=${list.page}`}
                      aria-current={conversation.id === selected ? 'page' : undefined}
                      className={cn(
                        'hover:bg-muted flex gap-3 p-4 transition-colors',
                        conversation.unreadCount > 0 && 'bg-primary/5',
                        conversation.id === selected && 'bg-primary/10 ring-primary/20 ring-1 ring-inset'
                      )}
                    >
                      <ConversationAvatar userId={conversation.otherId} name={conversation.otherName} url={conversation.otherAvatar} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn('truncate text-sm font-medium', conversation.unreadCount > 0 && 'font-semibold')}>
                            {conversation.otherName}
                          </p>
                          <time dateTime={conversation.lastMessageAt} className="text-muted-foreground text-[10px]">
                            {formatConversationTime(conversation.lastMessageAt, reference)}
                          </time>
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">{conversation.listingTitle}</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <p className={cn('truncate text-xs', conversation.unreadCount > 0 ? 'font-medium' : 'text-muted-foreground')}>
                            {conversation.lastMessageOwn && 'You: '}
                            {conversation.lastMessage ?? 'No messages yet'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="shrink-0 tabular-nums" aria-label={`${conversation.unreadCount} unread messages`}>
                              {formatUnreadBadge(conversation.unreadCount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {list.totalPages > 1 && (
              <div className="border-t p-2">
                <NuqsPagination totalPages={list.totalPages} ariaLabel="Conversation pages" />
              </div>
            )}
          </aside>
          {detail ? (
            <ChatView key={detail.id} conversation={detail} reference={reference} />
          ) : (
            <div className="text-muted-foreground bg-card hidden min-h-96 items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm xl:flex">
              Choose a conversation to read and send messages.
            </div>
          )}
        </div>
      </MessagesRealtime>
    </section>
  )
}
