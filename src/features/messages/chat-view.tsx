'use client'

import { ArrowLeft, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useMessagingRealtime } from '@/app/chat-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { markConversationRead, sendConversationMessage } from './actions'
import { conversationChannel } from './channels'
import { formatMessageTime } from './format-time'
import { ListingThumbnail } from './listing-thumbnail'
import { loadConversationMessages } from './load-messages'
import { messageContentSchema } from './schema'
import type { ChatMessage, ConversationDetails } from './types'

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  return [...new Map([...current, ...incoming].map((message) => [message.id, message])).values()].sort((a, b) => a.sequence - b.sequence)
}

export function ChatView({ conversation }: { conversation: ConversationDetails }) {
  const router = useRouter()
  const realtime = useMessagingRealtime()
  const [messages, setMessages] = useState(conversation.history.messages)
  const [hasOlder, setHasOlder] = useState(conversation.history.hasMore)
  const [olderPending, setOlderPending] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [sending, startTransition] = useTransition()
  const scroll = useRef<HTMLDivElement>(null)
  const scrollMode = useRef<{ type: 'bottom' } | { type: 'preserve'; height: number; top: number } | null>({ type: 'bottom' })
  const afterSequence = useRef(conversation.history.messages.at(-1)?.sequence ?? 0)
  const retryMessage = useRef<{ id: string; content: string } | null>(null)
  const synchronize = useRef<() => Promise<void>>(async () => {})
  const acknowledge = useRef<() => Promise<void>>(async () => {})

  useLayoutEffect(() => {
    const container = scroll.current
    if (!container) return
    if (scrollMode.current?.type === 'bottom') container.scrollTop = container.scrollHeight
    if (scrollMode.current?.type === 'preserve') {
      container.scrollTop = scrollMode.current.top + container.scrollHeight - scrollMode.current.height
    }
    scrollMode.current = null
  }, [messages])

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    let busy = false
    let queued = false
    let readThrough = -1
    let readBusy = false

    async function markVisibleRead() {
      if (disposed || readBusy || document.visibilityState !== 'visible' || !document.hasFocus() || afterSequence.current <= readThrough) return
      readBusy = true
      const through = afterSequence.current
      try {
        const result = await markConversationRead({ conversationId: conversation.id, throughSequence: through })
        if (!disposed) {
          if (result.success) {
            readThrough = through
            if (result.data.changed) router.refresh()
          } else setSyncError(result.message)
        }
      } catch {
        if (!disposed) setSyncError('Could not update read state. Retrying when your connection recovers.')
      } finally {
        readBusy = false
      }
    }

    async function sync() {
      if (disposed || document.visibilityState !== 'visible') return
      if (busy) {
        queued = true
        return
      }
      busy = true
      try {
        // Each request is bounded; continue until all missed database messages have been reconciled.
        let more = true
        while (more && !disposed) {
          const result = await loadConversationMessages({ conversationId: conversation.id, after: afterSequence.current }, controller.signal)
          if (disposed) return
          if (!result.success) {
            setSyncError(result.message)
            return
          }
          const incoming = result.data.messages
          if (incoming.length) {
            const container = scroll.current
            if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 80) scrollMode.current = { type: 'bottom' }
            setMessages((current) => mergeMessages(current, incoming))
            afterSequence.current = incoming[incoming.length - 1].sequence
          }
          more = result.data.hasMore && incoming.length > 0
        }
        if (!disposed) setSyncError(null)
        await markVisibleRead()
      } catch {
        if (!disposed) setSyncError('Could not refresh messages. Check your connection or try again.')
      } finally {
        busy = false
        if (queued && !disposed) {
          queued = false
          void sync()
        }
      }
    }

    synchronize.current = sync
    acknowledge.current = markVisibleRead
    const channel = realtime?.channels.get(conversationChannel(conversation.id))
    const onChanged = () => {
      void sync()
    }
    void channel
      ?.subscribe('changed', onChanged)
      .then(onChanged)
      .catch(() => {
        if (!disposed) setSyncError('Realtime is unavailable. Messages will refresh automatically.')
      })
    const interval = setInterval(onChanged, 15000)
    realtime?.connection.on('connected', onChanged)
    window.addEventListener('focus', onChanged)
    window.addEventListener('online', onChanged)
    document.addEventListener('visibilitychange', onChanged)
    void sync()
    return () => {
      disposed = true
      controller.abort()
      clearInterval(interval)
      channel?.unsubscribe('changed', onChanged)
      realtime?.connection.off('connected', onChanged)
      window.removeEventListener('focus', onChanged)
      window.removeEventListener('online', onChanged)
      document.removeEventListener('visibilitychange', onChanged)
    }
  }, [conversation.id, realtime, router])

  async function loadOlder() {
    if (olderPending || !messages[0]) return
    setOlderPending(true)
    setError(null)
    try {
      const result = await loadConversationMessages({ conversationId: conversation.id, before: messages[0].sequence })
      if (!result.success) {
        setError(result.message)
        return
      }
      const container = scroll.current
      if (container) scrollMode.current = { type: 'preserve', height: container.scrollHeight, top: container.scrollTop }
      setMessages((current) => mergeMessages(current, result.data.messages))
      setHasOlder(result.data.hasMore)
    } catch {
      setError('Could not load older messages. Please try again.')
    } finally {
      setOlderPending(false)
    }
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending || !conversation.canSend) return
    const parsed = messageContentSchema.safeParse(content)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    const draft = retryMessage.current?.content === parsed.data ? retryMessage.current : { id: crypto.randomUUID(), content: parsed.data }
    retryMessage.current = draft
    setError(null)
    startTransition(async () => {
      try {
        const result = await sendConversationMessage({ conversationId: conversation.id, messageId: draft.id, content: draft.content })
        if (!result.success) {
          setError(result.message)
          return
        }
        scrollMode.current = { type: 'bottom' }
        setMessages((current) => mergeMessages(current, [result.data.message]))
        setContent('')
        retryMessage.current = null
        if (!result.data.realtimeDelivered) {
          toast.add({ title: 'Message saved', description: 'Realtime delivery is delayed. Your message is safely stored.', type: 'info' })
        }
        // Reconcile intervening messages before advancing the read watermark.
        await synchronize.current()
        router.refresh()
      } catch {
        setError('Could not confirm sending. Retry to check the same message safely.')
      }
    })
  }

  return (
    <section aria-label={`Conversation with ${conversation.otherName}`} className="bg-card flex min-w-0 flex-col overflow-hidden rounded-xl border">
      <header className="flex items-center gap-3 border-b p-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="icon"
          aria-label="Back to conversations"
          className="xl:hidden"
          render={<Link href="/account/messages" />}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <ListingThumbnail url={conversation.coverUrl} />
        <div className="min-w-0 flex-1">
          {conversation.listingId && conversation.listingAvailable ? (
            <Link href={`/listings/${conversation.listingId}`} className="hover:text-primary block truncate font-medium">
              {conversation.listingTitle}
            </Link>
          ) : (
            <p className="truncate font-medium">{conversation.listingTitle}</p>
          )}
          <p className="text-muted-foreground truncate text-sm">{conversation.otherName}</p>
          {!conversation.listingAvailable && (
            <p className="text-muted-foreground text-xs">Listing unavailable. This conversation remains available.</p>
          )}
        </div>
      </header>
      {syncError && (
        <div role="status" className="flex items-center justify-between gap-2 border-b px-4 py-2 text-xs">
          <p>{syncError}</p>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              void synchronize.current()
            }}
          >
            Retry
          </Button>
        </div>
      )}
      <div
        ref={scroll}
        className="flex h-[28rem] flex-col gap-4 overflow-y-auto p-4"
        onFocus={() => {
          void acknowledge.current()
        }}
      >
        {hasOlder && (
          <Button
            variant="outline"
            className="mx-auto"
            disabled={olderPending}
            onClick={() => {
              void loadOlder()
            }}
          >
            {olderPending ? 'Loading...' : 'Load older messages'}
          </Button>
        )}
        {!messages.length && (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
            Start the conversation with a question about this listing.
          </div>
        )}
        <ol aria-label="Messages" aria-live="polite" aria-relevant="additions" className="flex flex-col gap-4">
          {messages.map((message) => {
            const own = message.senderId === conversation.userId
            return (
              <li key={message.id} className={cn('flex flex-col gap-1', own ? 'items-end' : 'items-start')}>
                <p
                  className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm wrap-anywhere whitespace-pre-wrap',
                    own ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {message.content}
                </p>
                <time dateTime={message.createdAt} className="text-muted-foreground text-[11px]">
                  <span className="sr-only">{own ? 'You' : conversation.otherName}, </span>
                  {formatMessageTime(message.createdAt)}
                </time>
              </li>
            )
          })}
        </ol>
      </div>
      <form onSubmit={send} className="flex flex-col gap-2 border-t p-4">
        {!conversation.canSend && (
          <p role="status" className="text-destructive text-sm">
            Your account cannot send messages.
          </p>
        )}
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <Textarea
          id="chat-message"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message..."
          maxLength={2000}
          disabled={sending || !conversation.canSend}
          aria-invalid={!!error}
          aria-describedby={error ? 'chat-error' : undefined}
        />
        {error && (
          <p id="chat-error" role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">{content.length}/2000 · Enter adds a new line</span>
          <Button type="submit" disabled={sending || !conversation.canSend || !content.trim()} aria-busy={sending}>
            {sending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </section>
  )
}
