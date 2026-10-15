import { init, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from '@sentry/nextjs'
import 'server-only'
import { sentryErrorOptions } from '@/lib/sentry-privacy'

const dsn = process.env.SENTRY_DSN?.trim()

if (process.env.NODE_ENV === 'production' && dsn) {
  init({
    ...sentryErrorOptions,
    dsn,
    // Sentry 11 otherwise installs an OTel provider even when tracing is disabled.
    enableOpenTelemetrySetup: false,
    defaultIntegrations: false,
    integrations: [onUncaughtExceptionIntegration(), onUnhandledRejectionIntegration()]
  })
}
