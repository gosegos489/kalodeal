import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // DSN is public. This build-time alias is derived from the single server env value.
  // Never add SENTRY_AUTH_TOKEN (or spread process.env) here.
  env: { NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN?.trim() || '' },
  // These SDK flags work with Next's compiler in both Turbopack and webpack.
  compiler: { define: { __SENTRY_DEBUG__: false, __SENTRY_TRACING__: false } },
  cacheComponents: true,
  serverExternalPackages: ['ably'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
}

const authToken = process.env.SENTRY_AUTH_TOKEN?.trim() || undefined

export default withSentryConfig(nextConfig, {
  org: 'kalodeal',
  project: 'javascript-nextjs',
  authToken,
  telemetry: false,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: !authToken, deleteSourcemapsAfterUpload: true },
  // With credentials the SDK manages the release automatically; offline builds create no release.
  release: authToken ? undefined : { create: false, finalize: false },
  buildTimeInstrumentation: false,
  routeManifestInjection: false,
  suppressOnRouterTransitionStartWarning: true,
  webpack: {
    // onRequestError already captures App Router request errors without build-time wrappers.
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false
  }
})
