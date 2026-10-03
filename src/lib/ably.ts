import { Rest } from 'ably'
import jwt from 'jsonwebtoken'
import 'server-only'

function getApiKey() {
  const apiKey = process.env.ABLY_CHAT_API_KEY
  if (!apiKey || !apiKey.includes(':')) throw new Error('ABLY_CHAT_API_KEY is not defined or invalid')
  return apiKey
}

export function createAblyToken({ userId, rooms }: { userId: string; rooms: string[] }) {
  const [keyName, keySecret] = getApiKey().split(':')
  const capability = Object.fromEntries(rooms.map((room) => [room, ['subscribe']]))

  return jwt.sign(
    {
      'x-ably-clientId': userId,
      'x-ably-capability': JSON.stringify(capability)
    },
    keySecret,
    {
      algorithm: 'HS256',
      keyid: keyName,
      expiresIn: '5m'
    }
  )
}

let publisher: Rest | undefined

export async function publishMessagingUpdate(channels: string[]) {
  const client = (publisher ??= new Rest({ key: getApiKey(), httpRequestTimeout: 3000, httpMaxRetryCount: 0 }))
  // Events carry no user content; subscribers reconcile from their authorized PostgreSQL reads.
  const results = await Promise.allSettled(channels.map((channel) => client.channels.get(channel).publish('changed', {})))
  if (results.some((result) => result.status === 'rejected')) throw new Error('Realtime delivery unavailable')
}
