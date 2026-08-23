import { GoogleAnalytics } from '@next/third-parties/google'
import type { CookieConsent } from './constants'

type AnalyticsGateProps = {
  consent?: CookieConsent
}

export function AnalyticsGate({ consent }: AnalyticsGateProps) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  if (consent !== 'accepted' || !gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
