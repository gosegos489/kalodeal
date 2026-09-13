'use client'

import { useChatClient, useChatConnection } from '@ably/chat/react'

export function ChatStatus() {
  const { clientId } = useChatClient()
  const { currentStatus } = useChatConnection()

  return (
    <div>
      <p>Ably status: {currentStatus}</p>
      <p>User: {clientId ?? 'Connecting...'}</p>
    </div>
  )
}
