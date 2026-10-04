import { init, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from '@sentry/nextjs'
import 'server-only'
import { sentryErrorOptions } from '@/lib/sentry-privacy'

const dsn = process.env.SENTRY_DSN?.trim()

if (dsn) {
  init({
    ...sentryErrorOptions,
    dsn,
    defaultIntegrations: false,
    integrations: [onUncaughtExceptionIntegration(), onUnhandledRejectionIntegration()]
  })
}
