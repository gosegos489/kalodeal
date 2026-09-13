import 'server-only'

import { cookies } from 'next/headers'
import { AnalyticsGate } from './analytics-gate'
import { CookieModal } from './cookie-modal'
import { COOKIE_CONSENT_KEY, type CookieConsent } from './constants'

function getCookieConsent(value?: string): CookieConsent | undefined {
  if (value === 'accepted' || value === 'rejected') {
    return value
  }

  return undefined
}

export async function CookieConsentGate() {
  const cookieStore = await cookies()
  const consent = getCookieConsent(cookieStore.get(COOKIE_CONSENT_KEY)?.value)

  return (
    <>
      <CookieModal consent={consent} />
      <AnalyticsGate consent={consent} />
    </>
  )
}
