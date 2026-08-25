'use client'

import { ChatClient } from '@ably/chat'
import { ChatClientProvider } from '@ably/chat/react'
import * as Ably from 'ably'
import { AblyProvider } from 'ably/react'
import { useEffect, useState } from 'react'

type ChatProviderProps = {
  children: React.ReactNode
}

type Clients = {
  realtime: Ably.Realtime
  chat: ChatClient
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [clients, setClients] = useState<Clients | null>(null)

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authCallback: async (_, callback) => {
        try {
          const response = await fetch('/api/ably-token', {
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

    const handleConnected = () => {
      setClients({
        realtime,
        chat
      })
    }

    realtime.connection.once('connected', handleConnected)

    return () => {
      realtime.connection.off('connected', handleConnected)

      realtime.close()
    }
  }, [])

  if (!clients) {
    return null
  }

  return (
    <AblyProvider client={clients.realtime}>
      <ChatClientProvider client={clients.chat}>{children}</ChatClientProvider>
    </AblyProvider>
  )
}
