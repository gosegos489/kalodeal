import { headers } from 'next/headers'
import { createAblyToken } from '@/lib/ably'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const token = createAblyToken({
    userId: session.user.id,
    rooms: ['chat:test']
  })

  return new Response(token)
}
