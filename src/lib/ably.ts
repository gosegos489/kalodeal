import 'server-only'

import jwt from 'jsonwebtoken'

const apiKey = process.env.ABLY_CHAT_API_KEY

if (!apiKey) {
  throw new Error('ABLY_CHAT_API_KEY is not defined')
}

const [keyName, keySecret] = apiKey.split(':')

export function createAblyToken({ userId, rooms }: { userId: string; rooms: string[] }) {
  const capability = Object.fromEntries(
    rooms.map((room) => [
      room,
      [
        'publish',
        'subscribe',
        'presence',
        'history',
        'channel-metadata',
        'annotation-publish',
        'annotation-subscribe',
        'message-update-own',
        'message-delete-own'
      ]
    ])
  )

  return jwt.sign(
    {
      'x-ably-clientId': userId,
      'x-ably-capability': JSON.stringify(capability)
    },
    keySecret,
    {
      algorithm: 'HS256',
      keyid: keyName,
      expiresIn: '1h'
    }
  )
}
