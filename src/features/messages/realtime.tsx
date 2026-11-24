'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useSyncExternalStore, useTransition } from 'react'
import { useMessaging, useMessagingRealtime } from '@/app/chat-provider'
import { type RealtimeAvailability, getRealtimeAvailability } from './realtime-state'
import { ConversationPresence } from './use-participant-presence'

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

export function MessagesRealtime({ children, conversationId, otherId }: { children: React.ReactNode; conversationId?: string; otherId?: string }) {
  const t = useTranslations('Workspace')

  const { realtime, revision, selectConversation, refreshInbox, inboxStatus } = useMessaging()
  const router = useRouter()
  const status = useRealtimeStatus(inboxStatus)
  const [pending, startTransition] = useTransition()
  const previousRevision = useRef(revision)

  useEffect(() => {
    selectConversation(conversationId)
    refreshInbox()
    return () => selectConversation(undefined)
  }, [conversationId, realtime, selectConversation, refreshInbox])

  useEffect(() => {
    if (pending || previousRevision.current === revision) return
    const timer = setTimeout(() => {
      previousRevision.current = revision
      startTransition(() => router.refresh())
    }, 300)
    return () => clearTimeout(timer)
  }, [revision, pending, router])

  const content = (
    <>
      {status === 'unavailable' && (
        <p role="status" className="bg-muted rounded-lg px-4 py-2 text-xs">
          {t('realtimeUpdatesAreTemporarilyUnavailableMessagesRemainAvailableAndRefreshAutomaticall')}
        </p>
      )}
      {children}
    </>
  )
  return conversationId && otherId ? (
    <ConversationPresence key={conversationId} userId={otherId} conversationId={conversationId}>
      {content}
    </ConversationPresence>
  ) : (
    content
  )
}
