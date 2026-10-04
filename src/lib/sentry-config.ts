// Shared validation only. Never read server/build secrets in this browser-safe module.
export function isSentryPlaceholder(value: string | undefined): boolean {
  return !value?.trim() || /placeholder|changeme|dummy|your[-_ ]|example|[<>]|1234567890abcdef|0123456789abcdefghijklmnopqrstuvwxyz/i.test(value)
}

export function getSentryDsn(value: string | undefined): string | undefined {
  if (!value || isSentryPlaceholder(value)) return undefined
  try {
    const url = new URL(value.trim())
    if (
      url.protocol !== 'https:' ||
      !/^[a-f\d]{32}$/i.test(url.username) ||
      url.password ||
      !/^\/\d+$/.test(url.pathname) ||
      url.search ||
      url.hash ||
      url.hostname === 'o123456.ingest.sentry.io' ||
      url.pathname === '/9876543210'
    )
      return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

export function getSentryEnvironment(nodeEnv: string | undefined, deploymentEnv: string | undefined): 'production' | 'preview' | undefined {
  if (nodeEnv !== 'production') return undefined
  // A production-mode local build is not evidence of a production deployment.
  if (deploymentEnv === 'preview' || deploymentEnv === 'production') return deploymentEnv
  return undefined
}

export function canUploadSentrySourceMaps(config: {
  clientDsn?: string
  serverDsn?: string
  authToken?: string
  org?: string
  project?: string
}): boolean {
  return Boolean(
    getSentryDsn(config.clientDsn) &&
    getSentryDsn(config.serverDsn) &&
    !isSentryPlaceholder(config.authToken) &&
    !isSentryPlaceholder(config.org) &&
    !isSentryPlaceholder(config.project)
  )
}
