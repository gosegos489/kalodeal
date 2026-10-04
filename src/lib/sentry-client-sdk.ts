'use client'

import { captureException, init } from '@sentry/nextjs'
import { sentryErrorOptions } from './sentry-privacy'

let initialized = false

// This module is an async chunk. Static named imports let the bundler discard unused SDK exports.
export function reportClientException(error: unknown, dsn: string, environment: 'production' | 'preview'): void {
  if (!initialized) {
    init({ ...sentryErrorOptions, dsn, environment })
    initialized = true
  }
  captureException(error)
}
