import { messaging } from '@/features/messages/server'
import { MessagingError } from '@/features/messages/workflow'
import { captureServerException } from '@/lib/sentry-server'

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    return Response.json(await messaging.getUnreadCount(), { headers })
  } catch (error) {
    if (!(error instanceof MessagingError)) await captureServerException(error, { feature: 'messages', operation: 'unread-count' })
    return Response.json({ message: 'Could not refresh unread messages.' }, { status: error instanceof MessagingError ? error.status : 500, headers })
  }
}
