import { init } from '@sentry/nextjs'
import { sentryErrorOptions } from '@/lib/sentry-privacy'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  init({
    ...sentryErrorOptions,
    dsn,
    // Retain SDK exception handlers, deduplication and Next.js stack normalization only.
    integrations: (defaults) =>
      defaults.filter((integration) =>
        ['EventFilters', 'BrowserApiErrors', 'GlobalHandlers', 'LinkedErrors', 'Dedupe', 'NextjsClientStackFrameNormalization'].includes(
          integration.name
        )
      )
  })
}
