import type { Instrumentation } from 'next'
import { getSentryDsn, getSentryEnvironment } from '@/lib/sentry-config'

function isEnabled() {
  return Boolean(getSentryDsn(process.env.SENTRY_DSN) && getSentryEnvironment(process.env.NODE_ENV, process.env.VERCEL_ENV))
}

export async function register() {
  if (!isEnabled()) return
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config')
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!isEnabled()) return
  try {
    const { captureRequestError } = await import('@sentry/nextjs')
    // The framework's route template is useful; raw URLs and headers are private.
    captureRequestError(error, { path: context.routePath, method: request.method, headers: {} }, context)
  } catch {
    // Monitoring must not replace the original application error.
  }
}
