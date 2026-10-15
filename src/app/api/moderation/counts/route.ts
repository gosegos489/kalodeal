import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getModerationQueueCounts } from '@/features/moderation/data'
import { captureServerException } from '@/lib/sentry-server'

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    return Response.json(await getModerationQueueCounts(), { headers })
  } catch (error) {
    if (!(error instanceof AvatarError)) await captureServerException(error, { feature: 'moderation', operation: 'queue-counts' })
    return Response.json({ message: 'Could not load moderation counts.' }, { status: error instanceof AvatarError ? 403 : 500, headers })
  }
}
