'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { ChatProvider, useMessagingRealtime } from '@/app/chat-provider'
import { inboxChannel } from './channels'
import { type RealtimeAvailability, getRealtimeAvailability, subscribeToRealtimeUpdates } from './realtime-state'

export function useRealtimeStatus(subscriptionState: RealtimeAvailability) {
  const realtime = useMessagingRealtime()
  return useSyncExternalStore(
    (callback) => {
      realtime?.connection.on(callback)
      return () => realtime?.connection.off(callback)
    },
    () =>
      getRealtimeAvailability({
        connectionState: realtime?.connection.state,
        connectionErrorCode: realtime?.connection.errorReason?.code,
        subscriptionState
      }),
    () => 'initializing'
  )
}

function InboxRefresh({ userId }: { userId: string }) {
  const realtime = useMessagingRealtime()
  const [subscriptionState, setSubscriptionState] = useState<RealtimeAvailability>('initializing')
  const status = useRealtimeStatus(subscriptionState)
  const router = useRouter()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let disposed = false
    function refresh() {
      if (disposed || document.visibilityState !== 'visible' || timer) return
      timer = setTimeout(() => {
        timer = undefined
        if (!disposed) router.refresh()
      }, 300)
    }
    const channel = realtime?.channels.get(inboxChannel(userId))
    const unsubscribe = channel ? subscribeToRealtimeUpdates(channel, refresh, setSubscriptionState) : undefined
    realtime?.connection.on('connected', refresh)
    const interval = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      disposed = true
      if (timer) clearTimeout(timer)
      clearInterval(interval)
      unsubscribe?.()
      realtime?.connection.off('connected', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [realtime, router, userId])
  return status !== 'unavailable' ? null : (
    <p role="status" className="bg-muted rounded-lg px-4 py-2 text-xs">
      Realtime updates are temporarily unavailable. Messages remain available and refresh automatically.
    </p>
  )
}

export function MessagesRealtime({ children, userId, conversationId }: { children: React.ReactNode; userId: string; conversationId?: string }) {
  return (
    <ChatProvider key={conversationId ?? 'inbox'} conversationId={conversationId}>
      <InboxRefresh userId={userId} />
      {children}
    </ChatProvider>
  )
}
