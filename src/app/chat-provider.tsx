'use client'

import type { Realtime } from 'ably'
import { z } from 'zod'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { inboxChannel, presenceChannel } from '@/features/messages/channels'
import { type RealtimeAvailability, subscribeToRealtimeUpdates } from '@/features/messages/realtime-state'
import { canUseMarketplace } from '@/lib/account-role'
import { authClient } from '@/lib/auth-client'

type MessagingState = {
  realtime: Realtime | null
  unreadCount: number
  revision: number
  refreshInbox: () => void
  selectConversation: (id?: string) => void
  authorizedConversation?: string
  inboxStatus: RealtimeAvailability
}
const MessagingContext = createContext<MessagingState>({
  realtime: null,
  unreadCount: 0,
  revision: 0,
  refreshInbox: () => {},
  selectConversation: () => {},
  inboxStatus: 'initializing'
})
const unreadSchema = z.object({ unreadCount: z.number().int().min(0).max(9) })

export function useMessaging() {
  return useContext(MessagingContext)
}

export function useMessagingRealtime() {
  return useMessaging().realtime
}

export function useConversationRealtime(id: string) {
  const state = useMessaging()
  return state.authorizedConversation === id ? state.realtime : null
}

// One connection per authenticated browser tab, shared by navigation and chats.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const userId = session?.user && canUseMarketplace(session.user.role) ? session.user.id : undefined
  return <MessagingSession userId={userId}>{children}</MessagingSession>
}

function MessagingSession({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [clientState, setClientState] = useState<{ userId: string; client: Realtime } | null>(null)
  const [authorization, setAuthorization] = useState<{ client: Realtime; id?: string } | null>(null)
  const [inbox, setInbox] = useState<{ userId?: string; unreadCount: number; revision: number }>({ unreadCount: 0, revision: 0 })
  const [subscription, setSubscription] = useState<{ client: Realtime | null; status: RealtimeAvailability }>({
    client: null,
    status: 'initializing'
  })
  // Bind private state to its identity without remounting the application when
  // the client session finishes loading or the user signs out.
  const realtime = clientState?.userId === userId ? (clientState?.client ?? null) : null
  const authorizedConversation = authorization?.client === realtime ? authorization?.id : undefined
  const unreadCount = inbox.userId === userId ? inbox.unreadCount : 0
  const revision = inbox.userId === userId ? inbox.revision : 0
  const inboxStatus = subscription.client === realtime ? subscription.status : 'initializing'
  const selected = useRef<string | undefined>(undefined)
  const clientRef = useRef<Realtime | null>(null)
  const authorizeQueue = useRef(Promise.resolve())
  const refreshRef = useRef<() => void>(() => {})
  const refreshInbox = useCallback(() => refreshRef.current(), [])
  const selectConversation = useCallback((id?: string) => {
    selected.current = id
    setAuthorization(null)
    // Serialize auth changes so rapid navigation cannot apply an older token last.
    authorizeQueue.current = authorizeQueue.current
      .catch(() => {})
      .then(async () => {
        const client = clientRef.current
        if (!client || selected.current !== id) return
        await client.auth.authorize()
        if (clientRef.current === client && selected.current === id) setAuthorization({ client, id })
      })
      .catch(() => {
        /* Database-backed chat remains usable without realtime. */
      })
  }, [])

  useEffect(() => {
    if (!userId) return
    let disposed = false
    let client: Realtime | undefined
    void import('ably')
      .then(({ Realtime }) => {
        if (disposed) return
        client = new Realtime({
          authCallback: async (_, callback) => {
            try {
              const id = selected.current
              const query = id ? `?conversationId=${encodeURIComponent(id)}` : ''
              const response = await fetch(`/api/ably-token${query}`, { credentials: 'same-origin', cache: 'no-store' })
              if (!response.ok) throw new Error('Realtime authentication unavailable')
              callback(null, await response.text())
              // Also restore subscriptions after a failed initial authorization
              // or automatic token renewal, without opening a new connection.
              if (!disposed && client && selected.current === id) setAuthorization({ client, id })
            } catch {
              callback('Realtime authentication unavailable', null)
            }
          }
        })
        clientRef.current = client
        setClientState({ userId, client })
      })
      .catch(() => {
        /* Authorized HTTP reconciliation is independent of Ably. */
      })
    return () => {
      disposed = true
      clientRef.current = null
      client?.close()
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    let disposed = false
    let busy = false
    let queued = false
    let timer: ReturnType<typeof setTimeout> | undefined
    async function reconcile() {
      if (disposed || document.visibilityState !== 'visible') return
      if (busy) {
        queued = true
        return
      }
      busy = true
      try {
        const response = await fetch('/api/messages/unread', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal })
        const result = unreadSchema.safeParse(await response.json())
        if (!disposed && response.ok && result.success) {
          setInbox((previous) => ({ userId, unreadCount: result.data.unreadCount, revision: previous.userId === userId ? previous.revision + 1 : 1 }))
        } else if (!disposed && (response.status === 401 || response.status === 403)) {
          setInbox({ userId, unreadCount: 0, revision: 0 })
          clientRef.current?.close()
        }
      } catch {
        /* Retain the last confirmed count until reconciliation succeeds. */
      } finally {
        busy = false
        if (queued && !disposed) {
          queued = false
          refresh()
        }
      }
    }
    function refresh() {
      if (disposed || timer || document.visibilityState !== 'visible') return
      timer = setTimeout(() => {
        timer = undefined
        void reconcile()
      }, 250)
    }
    refreshRef.current = refresh
    const channel = realtime?.channels.get(inboxChannel(userId))
    const unsubscribe = channel
      ? subscribeToRealtimeUpdates(channel, refresh, (status) => {
          if (!disposed) setSubscription({ client: realtime, status })
        })
      : undefined
    realtime?.connection.on('connected', refresh)
    // Sparse fallback also covers a committed write whose publish failed (no outbox).
    const interval = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    refresh()
    return () => {
      disposed = true
      controller.abort()
      refreshRef.current = () => {}
      if (timer) clearTimeout(timer)
      clearInterval(interval)
      unsubscribe?.()
      realtime?.connection.off('connected', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [realtime, userId])

  useEffect(() => {
    if (!realtime || !userId) return
    const channel = realtime.channels.get(presenceChannel(userId))
    // A signed, fixed clientId and presence-only capability prevent impersonation.
    void channel.presence.enter().catch(() => {})
    return () => {
      void channel.presence.leave().catch(() => {})
    }
  }, [realtime, userId])

  return (
    <MessagingContext.Provider value={{ realtime, unreadCount, revision, refreshInbox, selectConversation, authorizedConversation, inboxStatus }}>
      {children}
    </MessagingContext.Provider>
  )
}
