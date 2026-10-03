import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { ChatView } from './chat-view'
import { formatMessageTime } from './format-time'
import { ListingThumbnail } from './listing-thumbnail'
import { MessagesRealtime } from './realtime'
import { getMyConversation, getMyConversations } from './server'
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
      <MessagesRealtime userId={list.userId} conversationId={selected}>
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
                      className={cn('hover:bg-muted flex gap-3 p-4 transition-colors', conversation.id === selected && 'bg-primary/5')}
                    >
                      <ListingThumbnail url={conversation.coverUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{conversation.listingTitle}</p>
                        <p className="text-muted-foreground truncate text-xs">{conversation.otherName}</p>
                        <p className="mt-1 truncate text-xs">{conversation.lastMessage ?? 'No messages yet'}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <time dateTime={conversation.lastMessageAt} className="text-muted-foreground text-[10px]">
                            {formatMessageTime(conversation.lastMessageAt)}
                          </time>
                          {conversation.unreadCount > 0 && (
                            <Badge aria-label={`${conversation.unreadCount} unread messages`}>{conversation.unreadCount}</Badge>
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
            <ChatView key={detail.id} conversation={detail} />
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
