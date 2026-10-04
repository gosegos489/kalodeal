import { messaging } from '@/features/messages/server'
import { MessagingError } from '@/features/messages/workflow'
import { captureServerException } from '@/lib/sentry-server'

export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const responseHeaders = { 'Cache-Control': 'private, no-store' }
  try {
    const { conversationId } = await params
    const query = new URL(request.url).searchParams
    if (query.getAll('before').length > 1 || query.getAll('after').length > 1) throw new MessagingError('Invalid history cursor.')
    const before = query.get('before')
    const after = query.get('after')
    if ([before, after].some((cursor) => cursor !== null && !/^\d+$/.test(cursor))) throw new MessagingError('Invalid history cursor.')
    const data = await messaging.getHistory({
      conversationId,
      ...(before !== null ? { before: Number(before) } : {}),
      ...(after !== null ? { after: Number(after) } : {})
    })
    return Response.json({ success: true, data }, { headers: responseHeaders })
  } catch (error) {
    if (!(error instanceof MessagingError)) await captureServerException(error, { feature: 'messages', operation: 'history' })
    return Response.json(
      { success: false, message: error instanceof MessagingError ? error.message : 'Could not load messages. Please try again.' },
      { status: error instanceof MessagingError ? error.status : 500, headers: responseHeaders }
    )
  }
}
