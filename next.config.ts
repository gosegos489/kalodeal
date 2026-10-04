import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'
import { canUploadSentrySourceMaps } from './src/lib/sentry-config'

const nextConfig: NextConfig = {
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

const uploadSourceMaps = canUploadSentrySourceMaps({
  clientDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  serverDsn: process.env.SENTRY_DSN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT
})

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: uploadSourceMaps ? process.env.SENTRY_AUTH_TOKEN : undefined,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: !uploadSourceMaps, deleteSourcemapsAfterUpload: true },
  release: { create: uploadSourceMaps, finalize: uploadSourceMaps },
  routeManifestInjection: false,
  suppressOnRouterTransitionStartWarning: true,
  webpack: {
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,
    automaticVercelMonitors: false,
    treeshake: { removeDebugLogging: true, removeTracing: true }
  }
})
