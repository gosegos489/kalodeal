'use client'

import { captureException } from '@sentry/nextjs'

export function captureClientException(error: unknown): void {
  // Server-render errors with a digest are already captured by onRequestError.
  if (typeof error === 'object' && error !== null && 'digest' in error && error.digest) return
  // The SDK suppresses repeat captures of the same Error, including React effect reruns.
  captureException(error)
}
