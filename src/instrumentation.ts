import type { Instrumentation } from 'next'

export async function register() {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN?.trim()) return
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config')
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN?.trim()) return
  try {
    const { captureRequestError } = await import('@sentry/nextjs')
    // The framework's route template is useful; raw URLs and headers are private.
    captureRequestError(error, { path: context.routePath, method: request.method, headers: {} }, context)
  } catch {
    // Monitoring must not replace the original application error.
  }
}
