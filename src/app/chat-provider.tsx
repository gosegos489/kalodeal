'use client'

import { ChatClient } from '@ably/chat'
import { ChatClientProvider } from '@ably/chat/react'
import * as Ably from 'ably'
import { AblyProvider } from 'ably/react'
import { createContext, useContext, useEffect, useState } from 'react'

type ChatProviderProps = {
  children: React.ReactNode
  conversationId?: string
}

type Clients = {
  realtime: Ably.Realtime
  chat: ChatClient
}

const RealtimeContext = createContext<Ably.Realtime | null>(null)

export function useMessagingRealtime() {
  return useContext(RealtimeContext)
}

export function ChatProvider({ children, conversationId }: ChatProviderProps) {
  const [clients, setClients] = useState<Clients | null>(null)

  useEffect(() => {
    let disposed = false
    const realtime = new Ably.Realtime({
      authCallback: async (_, callback) => {
        try {
          const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ''
          const response = await fetch(`/api/ably-token${query}`, {
            credentials: 'include',
            cache: 'no-store'
          })

          if (!response.ok) {
            throw new Error('Failed to authenticate with Ably')
          }

          const token = await response.text()

          callback(null, token)
        } catch (error) {
          callback(error instanceof Error ? error.message : 'Ably authentication failed', null)
        }
      }
    })

    const chat = new ChatClient(realtime)

    // Render database-backed UI even when Ably cannot connect.
    queueMicrotask(() => {
      if (!disposed) setClients({ realtime, chat })
    })

    return () => {
      disposed = true
      realtime.close()
    }
  }, [conversationId])

  return (
    <RealtimeContext.Provider value={clients?.realtime ?? null}>
      {clients ? (
        <AblyProvider client={clients.realtime}>
          <ChatClientProvider client={clients.chat}>{children}</ChatClientProvider>
        </AblyProvider>
      ) : (
        children
      )}
    </RealtimeContext.Provider>
  )
}
