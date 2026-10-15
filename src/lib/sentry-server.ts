import { after } from 'next/server'
import 'server-only'

type ErrorContext = {
  feature: string
  operation: string
  listingId?: string
  ticketId?: string
  conversationId?: string
  eventId?: string
  eventType?: string
}

function isEnabled() {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.SENTRY_DSN?.trim())
}

async function sendException(error: unknown, tags: ErrorContext): Promise<void> {
  try {
    const { captureException, flush } = await import('@sentry/nextjs')
    captureException(error, { tags: { feature: tags.feature, operation: tags.operation } })
    // after() keeps the serverless invocation alive without delaying the response.
    await flush(1500)
  } catch {
    // Reporting cannot change a committed result or a safe application failure.
  }
}

// Only for unexpected exceptions swallowed by an existing catch. No payloads or request/session objects.
// Existing callers may await this function; only scheduling, never delivery, is awaited.
export async function captureServerException(error: unknown, tags: ErrorContext): Promise<void> {
  if (!isEnabled()) return
  try {
    after(() => sendException(error, tags))
  } catch {
    // Outside a Next request, preserve the original result rather than blocking on telemetry.
  }
}

// Better Auth invokes its error hook synchronously, without awaiting its promise.
export function captureServerExceptionAfterResponse(error: unknown, tags: ErrorContext): void {
  void captureServerException(error, tags)
}
