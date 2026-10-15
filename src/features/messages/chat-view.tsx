'use client'

import { ArrowDown, ArrowLeft, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useConversationRealtime, useMessaging } from '@/app/chat-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { markConversationRead, sendConversationMessage } from './actions'
import { conversationChannel } from './channels'
import { ChatMessageList, ChatParticipantHeader, type DisplayMessage } from './chat-presentation'
import { loadConversationMessages } from './load-messages'
import { mergeMessages, renderedReadSequence } from './message-state'
import { ReportUserButton } from './report-user-button'
import { messageContentSchema } from './schema'
import type { ConversationDetails } from './types'
import { useConversationPresence } from './use-participant-presence'

function isAtBottom(container: HTMLDivElement | null) {
  return !!container && container.scrollHeight - container.scrollTop - container.clientHeight < 80
}

type PendingMessage = DisplayMessage & { delivery: 'sending' | 'failed' }

export function ChatView({ conversation, reference }: { conversation: ConversationDetails; reference: string }) {
  const realtime = useConversationRealtime(conversation.id)
  const { refreshInbox } = useMessaging()
  const presence = useConversationPresence()
  const [messages, setMessages] = useState(conversation.history.messages)
  const [otherReadSequence, setOtherReadSequence] = useState(conversation.history.otherReadSequence)
  const [optimistic, setOptimistic] = useState<PendingMessage | null>(null)
  const [hasOlder, setHasOlder] = useState(conversation.history.hasMore)
  const [olderPending, setOlderPending] = useState(false)
  const [newMessages, setNewMessages] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [sending, startTransition] = useTransition()
  const scroll = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const scrollMode = useRef<{ type: 'bottom' } | { type: 'preserve'; height: number; top: number } | null>({ type: 'bottom' })
  const afterSequence = useRef(conversation.history.messages.at(-1)?.sequence ?? 0)
  const renderedThrough = useRef(0)
  const retryMessage = useRef<PendingMessage | null>(null)
  const sendBusy = useRef(false)
  const olderBusy = useRef(false)
  const focusAfterSend = useRef(false)
  const synchronize = useRef<() => Promise<void>>(async () => {})
  const acknowledge = useRef<() => Promise<void>>(async () => {})
  const pending = optimistic && !messages.some((message) => message.id === optimistic.id) ? optimistic : null

  useLayoutEffect(() => {
    const container = scroll.current
    if (!container) return
    if (scrollMode.current?.type === 'bottom') container.scrollTop = container.scrollHeight
    if (scrollMode.current?.type === 'preserve') {
      container.scrollTop = scrollMode.current.top + container.scrollHeight - scrollMode.current.height
    }
    scrollMode.current = null
    // A read can only acknowledge persisted messages already committed to the DOM.
    renderedThrough.current = renderedReadSequence(messages, afterSequence.current)
    void acknowledge.current()
  }, [messages, optimistic])

  useLayoutEffect(() => {
    const input = textarea.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`
  }, [content])

  useEffect(() => {
    if (!sending && focusAfterSend.current) {
      focusAfterSend.current = false
      textarea.current?.focus()
    }
  }, [sending])

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    let busy = false
    let queued = false
    let readThrough = -1
    let readBusy = false

    async function markVisibleRead() {
      if (
        disposed ||
        readBusy ||
        !isAtBottom(scroll.current) ||
        document.visibilityState !== 'visible' ||
        !document.hasFocus() ||
        renderedThrough.current <= readThrough
      )
        return
      const target = bottom.current?.getBoundingClientRect()
      const viewport = scroll.current?.getBoundingClientRect()
      if (!target || !viewport || target.top < Math.max(0, viewport.top) || target.bottom > Math.min(window.innerHeight, viewport.bottom)) return
      readBusy = true
      const through = renderedThrough.current
      try {
        const result = await markConversationRead({ conversationId: conversation.id, throughSequence: through })
        if (!disposed) {
          if (result.success) {
            readThrough = through
            if (result.data.changed) refreshInbox()
          } else setSyncError(result.message)
        }
      } catch {
        if (!disposed) setSyncError('Could not update read state. Retrying when your connection recovers.')
      } finally {
        readBusy = false
        // Messages can commit while the previous acknowledgement is in flight.
        if (!disposed && readThrough >= through && renderedThrough.current > through) void markVisibleRead()
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
        let more = true
        while (more && !disposed) {
          const result = await loadConversationMessages({ conversationId: conversation.id, after: afterSequence.current }, controller.signal)
          if (disposed) return
          if (!result.success) {
            setSyncError(result.message)
            return
          }
          setOtherReadSequence((current) => Math.max(current, result.data.otherReadSequence))
          const incoming = result.data.messages
          if (incoming.length) {
            if (isAtBottom(scroll.current)) scrollMode.current = { type: 'bottom' }
            else if (incoming.some((message) => message.senderId !== conversation.userId)) setNewMessages(true)
            setMessages((current) => mergeMessages(current, incoming))
            afterSequence.current = incoming[incoming.length - 1].sequence
            const retry = retryMessage.current
            if (retry && incoming.some((message) => message.id === retry.id)) {
              retryMessage.current = null
              setOptimistic(null)
              setContent((current) => (current.trim() === retry.content ? '' : current))
              setError(null)
            }
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
    const observer = new IntersectionObserver(() => {
      void markVisibleRead()
    })
    if (bottom.current) observer.observe(bottom.current)
    const channel = realtime?.channels.get(conversationChannel(conversation.id))
    let timer: ReturnType<typeof setTimeout> | undefined
    const onChanged = () => {
      if (disposed || timer) return
      timer = setTimeout(() => {
        timer = undefined
        void sync()
      }, 100)
    }
    void channel
      ?.subscribe('changed', onChanged)
      .then(onChanged)
      .catch(() => {
        if (!disposed) setSyncError('Realtime is unavailable. Messages will refresh automatically.')
      })
    channel?.on('attached', onChanged)
    const interval = setInterval(onChanged, 30000)
    realtime?.connection.on('connected', onChanged)
    window.addEventListener('focus', onChanged)
    window.addEventListener('online', onChanged)
    document.addEventListener('visibilitychange', onChanged)
    void sync()
    return () => {
      disposed = true
      controller.abort()
      observer.disconnect()
      if (timer) clearTimeout(timer)
      clearInterval(interval)
      channel?.unsubscribe('changed', onChanged)
      channel?.off('attached', onChanged)
      if (channel) void channel.detach().catch(() => {})
      realtime?.connection.off('connected', onChanged)
      window.removeEventListener('focus', onChanged)
      window.removeEventListener('online', onChanged)
      document.removeEventListener('visibilitychange', onChanged)
      acknowledge.current = async () => {}
    }
  }, [conversation.id, conversation.userId, realtime, refreshInbox])

  async function loadOlder() {
    if (olderBusy.current || !messages[0]) return
    olderBusy.current = true
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
      setOtherReadSequence((current) => Math.max(current, result.data.otherReadSequence))
      setHasOlder(result.data.hasMore)
    } catch {
      setError('Could not load older messages. Please try again.')
    } finally {
      olderBusy.current = false
      setOlderPending(false)
    }
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sendBusy.current || !conversation.canSend) return
    const parsed = messageContentSchema.safeParse(retryMessage.current?.content ?? content)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    const draft: PendingMessage = retryMessage.current ?? {
      id: crypto.randomUUID(),
      content: parsed.data,
      senderId: conversation.userId,
      sequence: 0,
      createdAt: new Date().toISOString(),
      delivery: 'sending'
    }
    sendBusy.current = true
    focusAfterSend.current = true
    retryMessage.current = draft
    scrollMode.current = { type: 'bottom' }
    setOptimistic({ ...draft, delivery: 'sending' })
    setError(null)
    startTransition(async () => {
      try {
        const result = await sendConversationMessage({ conversationId: conversation.id, messageId: draft.id, content: draft.content })
        if (!result.success) {
          if (retryMessage.current?.id === draft.id) {
            setError(result.message)
            setOptimistic({ ...draft, delivery: 'failed' })
          }
          return
        }
        scrollMode.current = { type: 'bottom' }
        setMessages((current) => mergeMessages(current, [result.data.message]))
        setOptimistic(null)
        setContent((current) => (current.trim() === draft.content ? '' : current))
        retryMessage.current = null
        if (!result.data.realtimeDelivered)
          toast.add({ title: 'Message saved', description: 'Realtime delivery is delayed. Your message is safely stored.', type: 'info' })
        // Reconcile gaps before advancing the cursor/watermark past intervening messages.
        await synchronize.current()
        refreshInbox()
      } catch {
        if (retryMessage.current?.id === draft.id) {
          setOptimistic({ ...draft, delivery: 'failed' })
          setError('Could not confirm sending. Retry to check the same message safely.')
        }
      } finally {
        sendBusy.current = false
      }
    })
  }

  function showLatest() {
    const container = scroll.current
    if (container) container.scrollTop = container.scrollHeight
    setNewMessages(false)
    void acknowledge.current()
  }

  return (
    <section aria-label={`Conversation with ${conversation.otherName}`} className="bg-card flex min-w-0 flex-col overflow-hidden rounded-xl border">
      <header className="flex flex-wrap items-center gap-3 border-b p-4">
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
        <div className="min-w-0 flex-1">
          <ChatParticipantHeader
            participant={{ id: conversation.otherId, name: conversation.otherName, avatar: conversation.otherAvatar }}
            online={presence.online}
            status={presence.label}
          />
          {conversation.listingId && conversation.listingAvailable ? (
            <Link href={`/listings/${conversation.listingId}`} className="text-muted-foreground hover:text-primary mt-2 block truncate text-xs">
              {conversation.listingTitle}
            </Link>
          ) : (
            <p className="text-muted-foreground mt-2 truncate text-xs">{conversation.listingTitle} · Listing unavailable</p>
          )}
        </div>
        <ReportUserButton conversationId={conversation.id} otherName={conversation.otherName} />
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
      <div className="relative min-w-0">
        <div
          ref={scroll}
          tabIndex={0}
          aria-label="Message history"
          className="flex h-[min(28rem,55dvh)] min-h-56 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain p-4 [overflow-anchor:none] sm:h-[28rem]"
          onFocus={() => {
            void acknowledge.current()
          }}
          onScroll={() => {
            if (isAtBottom(scroll.current)) {
              setNewMessages(false)
              void acknowledge.current()
            }
          }}
        >
          {hasOlder && (
            <Button
              variant="outline"
              className="mx-auto shrink-0"
              disabled={olderPending}
              onClick={() => {
                void loadOlder()
              }}
            >
              {olderPending ? 'Loading...' : 'Load older messages'}
            </Button>
          )}
          {!messages.length && !pending && (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-center text-sm">
              Start the conversation with a question about this listing.
            </div>
          )}
          <ChatMessageList
            messages={pending ? [...messages, pending] : messages}
            rightSenderId={conversation.userId}
            participants={[
              { id: conversation.userId, name: 'You', avatar: null },
              { id: conversation.otherId, name: conversation.otherName, avatar: conversation.otherAvatar }
            ]}
            readBySender={{ [conversation.userId]: otherReadSequence }}
            reference={reference}
            live
          />
          <div ref={bottom} aria-hidden="true" className="h-px shrink-0" />
        </div>
        {newMessages && (
          <Button size="sm" variant="secondary" className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md" onClick={showLatest}>
            New messages <ArrowDown aria-hidden="true" />
          </Button>
        )}
      </div>
      <form ref={form} onSubmit={send} className="flex flex-col gap-2 border-t p-3 sm:p-4">
        {!conversation.canSend && (
          <p role="status" className="text-destructive text-sm">
            Your account cannot send messages.
          </p>
        )}
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <Textarea
          ref={textarea}
          id="chat-message"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              form.current?.requestSubmit()
            }
          }}
          placeholder="Write a message..."
          rows={1}
          className="max-h-40 min-h-11 resize-none overflow-y-auto"
          maxLength={2000}
          disabled={sending || !conversation.canSend}
          aria-invalid={!!error}
          aria-describedby={error ? 'chat-error' : 'chat-hint'}
        />
        {error && (
          <p id="chat-error" role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span id="chat-hint" className="text-muted-foreground text-xs">
            {pending?.delivery === 'failed'
              ? 'Retry the pending message before sending another.'
              : `${content.length}/2000 · Shift+Enter for a new line`}
          </span>
          <Button type="submit" disabled={sending || !conversation.canSend || (!content.trim() && !pending)} aria-busy={sending}>
            {sending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
            {sending ? 'Sending...' : pending?.delivery === 'failed' ? 'Retry' : 'Send'}
          </Button>
        </div>
      </form>
    </section>
  )
}
