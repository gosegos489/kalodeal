import { messaging } from '@/features/messages/server'
import { MessagingError } from '@/features/messages/workflow'
import { createAblyToken } from '@/lib/ably'

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    if (params.getAll('conversationId').length > 1) return new Response('Invalid conversation', { status: 400 })
    const { viewer, channels } = await messaging.getChannels(params.get('conversationId') ?? undefined)
    return new Response(createAblyToken({ userId: viewer, rooms: channels }), {
      headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    return new Response(error instanceof MessagingError ? error.message : 'Realtime temporarily unavailable', {
      status: error instanceof MessagingError ? error.status : 503,
      headers: { 'Cache-Control': 'private, no-store' }
    })
  }
}
