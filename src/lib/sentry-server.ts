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
  return Boolean(process.env.SENTRY_DSN?.trim())
}

// Only for unexpected exceptions swallowed by an existing catch. No payloads or request/session objects.
export async function captureServerException(error: unknown, tags: ErrorContext): Promise<void> {
  if (!isEnabled()) return
  try {
    const { captureException, flush } = await import('@sentry/nextjs')
    captureException(error, { tags: { feature: tags.feature, operation: tags.operation } })
    // Bounded flush prevents serverless responses from freezing a queued event.
    await flush(1500)
  } catch {
    // Reporting cannot change a committed result or a safe application failure.
  }
}

// Better Auth invokes its error hook synchronously, without awaiting its promise.
export function captureServerExceptionAfterResponse(error: unknown, tags: ErrorContext): void {
  if (!isEnabled()) return
  try {
    after(() => captureServerException(error, tags))
  } catch {
    // A call outside the Next request lifecycle must retain the original auth behavior.
  }
}
