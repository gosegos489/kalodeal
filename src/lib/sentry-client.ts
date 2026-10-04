'use client'

import { getSentryDsn, getSentryEnvironment } from './sentry-config'

const dsn = getSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN)
const environment = getSentryEnvironment(process.env.NODE_ENV, process.env.NEXT_PUBLIC_VERCEL_ENV)
let sdk: Promise<(typeof import('./sentry-client-sdk'))['reportClientException']> | undefined
let pending = 0
const captured = new WeakSet<object>()

export function captureClientException(error: unknown): void {
  // Server-render errors with a digest are already captured by onRequestError.
  if (!dsn || !environment || pending >= 20 || (typeof error === 'object' && error !== null && 'digest' in error)) return
  if (typeof error === 'object' && error !== null) {
    if (captured.has(error)) return
    captured.add(error)
  }
  pending++
  sdk ??= import('./sentry-client-sdk').then(({ reportClientException }) => reportClientException)
  void sdk
    .then((reportClientException) => {
      reportClientException(error, dsn, environment)
    })
    .catch(() => {
      // A blocked SDK chunk must not create an unhandled rejection or repeated load requests.
    })
    .finally(() => {
      pending--
    })
}

export function registerClientErrorTracking(): void {
  if (!dsn || !environment) return
  window.addEventListener('error', (event) => {
    // Resource load errors are not JavaScript exceptions.
    if (event.error) captureClientException(event.error)
  })
  window.addEventListener('unhandledrejection', (event) => captureClientException(event.reason))
}
