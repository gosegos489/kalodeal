'use client'

import type { PresenceMessage, Realtime } from 'ably'
import { useLocale, useTranslations } from 'next-intl'
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { useConversationRealtime } from '@/app/chat-provider'
import { presenceChannel } from './channels'
import { ChatAvatar } from './chat-presentation'
import { formatLastSeen } from './format-time'

export function useParticipantPresence(userId: string, conversationId: string) {
  const t = useTranslations('Workspace')
  const locale = useLocale()

  const realtime = useConversationRealtime(conversationId)
  const connected = useSyncExternalStore(
    (callback) => {
      realtime?.connection.on(callback)
      return () => realtime?.connection.off(callback)
    },
    () => realtime?.connection.state === 'connected',
    () => false
  )
  const [state, setState] = useState<{ source: Realtime | null; online: boolean | null; lastSeen: string | null }>({
    source: null,
    online: null,
    lastSeen: null
  })
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    if (!realtime) return
    const channel = realtime.channels.get(presenceChannel(userId))
    let disposed = false
    let busy = false
    let queued = false
    let wasOnline = false
    let leaveTime: string | null = null
    let generation = 0
    async function sync() {
      if (disposed || realtime?.connection.state !== 'connected') return
      if (busy) {
        queued = true
        return
      }
      busy = true
      const startedAtGeneration = generation
      try {
        const members = await channel.presence.get({ clientId: userId })
        if (disposed || realtime?.connection.state !== 'connected') return
        if (startedAtGeneration !== generation) {
          queued = true
          return
        }
        const online = members.some((member) => member.clientId === userId)
        const observedLeave = wasOnline && !online ? leaveTime : null
        wasOnline = online
        leaveTime = null
        setState((previous) => ({
          source: realtime,
          online,
          lastSeen: online ? null : (observedLeave ?? (previous.source === realtime ? previous.lastSeen : null))
        }))
        setNow(new Date().toISOString())
      } catch {
        if (!disposed) setState({ source: realtime, online: null, lastSeen: null })
      } finally {
        busy = false
        if (queued && !disposed) {
          queued = false
          void sync()
        }
      }
    }
    function changed(member: PresenceMessage) {
      if (member.clientId !== userId) return
      generation++
      if (member.action === 'leave' && member.timestamp) leaveTime = new Date(member.timestamp).toISOString()
      void sync()
    }
    function attached() {
      void sync()
    }
    function unavailable() {
      generation++
      wasOnline = false
      leaveTime = null
      if (!disposed) setState({ source: realtime, online: null, lastSeen: null })
    }
    void channel.presence.subscribe(changed).then(attached).catch(unavailable)
    channel.on('attached', attached)
    channel.on('suspended', unavailable)
    channel.on('failed', unavailable)
    realtime.connection.on('disconnected', unavailable)
    realtime.connection.on('connected', attached)
    const clock = setInterval(() => setNow(new Date().toISOString()), 60000)
    return () => {
      disposed = true
      clearInterval(clock)
      channel.presence.unsubscribe(changed)
      channel.off('attached', attached)
      channel.off('suspended', unavailable)
      channel.off('failed', unavailable)
      realtime.connection.off('disconnected', unavailable)
      realtime.connection.off('connected', attached)
      void channel.detach().catch(() => {})
    }
  }, [realtime, userId])

  const online = connected && state.source === realtime ? state.online : null
  return {
    online: online === true,
    label:
      online === null
        ? t('statusUnavailable')
        : online
          ? t('online')
          : state.lastSeen && now
            ? formatLastSeen(state.lastSeen, now, locale, t)
            : t('offline')
  }
}

const PresenceContext = createContext({ userId: '', online: false, label: 'Status unavailable' })

export function ConversationPresence({ userId, conversationId, children }: { userId: string; conversationId: string; children: React.ReactNode }) {
  const presence = useParticipantPresence(userId, conversationId)
  return <PresenceContext.Provider value={{ userId, ...presence }}>{children}</PresenceContext.Provider>
}

export function useConversationPresence() {
  return useContext(PresenceContext)
}

export function ConversationAvatar({ userId, name, url }: { userId: string; name: string; url: string | null }) {
  const t = useTranslations('Workspace')

  const presence = useConversationPresence()
  const online = presence.userId === userId && presence.online
  return (
    <span>
      <ChatAvatar name={name} url={url} online={online} />
      {online && <span className="sr-only">{t('online')}</span>}
    </span>
  )
}
