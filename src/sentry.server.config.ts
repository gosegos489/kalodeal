import { init, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from '@sentry/nextjs'
import 'server-only'
import { getSentryDsn, getSentryEnvironment } from '@/lib/sentry-config'
import { sentryErrorOptions } from '@/lib/sentry-privacy'

const dsn = getSentryDsn(process.env.SENTRY_DSN)
const environment = getSentryEnvironment(process.env.NODE_ENV, process.env.VERCEL_ENV)

if (dsn && environment) {
  init({
    ...sentryErrorOptions,
    dsn,
    environment,
    skipOpenTelemetrySetup: true,
    integrations: [onUncaughtExceptionIntegration(), onUnhandledRejectionIntegration()]
  })
}
