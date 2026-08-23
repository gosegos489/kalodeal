'use server'

import { cookies } from 'next/headers'
import { COOKIE_CONSENT_KEY, type CookieConsent } from './constants'

export async function setCookieConsent(consent: CookieConsent) {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_CONSENT_KEY, consent, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })
}
