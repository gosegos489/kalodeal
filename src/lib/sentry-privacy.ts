import type { ErrorEvent, EventHint } from '@sentry/nextjs'

export function isSentryControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const digest = 'digest' in error && typeof error.digest === 'string' ? error.digest : ''
  return digest.startsWith('NEXT_REDIRECT;') || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;') || digest.startsWith('NEXT_NOT_FOUND')
}

function cleanFramePath(path: string | undefined): string | undefined {
  // Keep script identity for source maps, but never URL credentials/query/hash or local home directories.
  return path
    ?.replace(/\/Users\/[^/]+\//g, '/Users/[redacted]/')
    .replace(/\/home\/[^/]+\//g, '/home/[redacted]/')
    .replace(/(https?:\/\/)[^/@]+:[^/@]+@/g, '$1')
    .split(/[?#]/, 1)[0]
}

const safeTags = ['feature', 'operation', 'listingId', 'ticketId', 'conversationId', 'eventId', 'eventType'] as const

// Deliberate allowlist: SDK defaults and third-party exceptions can contain private payloads.
// Retain error type + stack for grouping; arbitrary exception messages are not safe to collect.
export function beforeSendSentryError(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isSentryControlFlowError(hint.originalException)) return null
  return {
    type: event.type,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    environment: event.environment,
    release: event.release,
    dist: event.dist,
    sdk: event.sdk,
    debug_meta: event.debug_meta,
    tags: Object.fromEntries(safeTags.flatMap((key) => (event.tags?.[key] === undefined ? [] : [[key, event.tags[key]]]))),
    exception: {
      values: event.exception?.values?.map((exception) => ({
        type: exception.type,
        value: 'Unexpected application exception (message omitted for privacy)',
        mechanism: exception.mechanism
          ? {
              type: exception.mechanism.type,
              handled: exception.mechanism.handled
            }
          : undefined,
        stacktrace: exception.stacktrace
          ? {
              frames: exception.stacktrace.frames?.map((frame) => ({
                filename: cleanFramePath(frame.filename),
                abs_path: cleanFramePath(frame.abs_path),
                function: frame.function,
                module: frame.module,
                lineno: frame.lineno,
                colno: frame.colno,
                in_app: frame.in_app
              }))
            }
          : undefined
      }))
    }
  }
}

export const sentryErrorOptions = {
  defaultIntegrations: false as const,
  sendDefaultPii: false,
  // No sampling option means tracing is disabled, rather than creating and dropping spans.
  tracePropagationTargets: [],
  enableLogs: false,
  autoSessionTracking: false,
  sendClientReports: false,
  maxBreadcrumbs: 0,
  beforeSend: beforeSendSentryError
}
