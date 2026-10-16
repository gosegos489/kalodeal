import { z } from 'zod'
import { isSafeLegalLink } from '@/entities/legal/links'

export type LegalLinkKind = 'website' | 'phone' | 'email'

export function getLegalLinkInput(href: string): { kind: LegalLinkKind; value: string } {
  if (/^mailto:/i.test(href)) return { kind: 'email', value: href.slice(7) }
  if (/^tel:/i.test(href)) return { kind: 'phone', value: href.slice(4) }
  return { kind: 'website', value: href }
}

export function buildLegalLink(kind: LegalLinkKind, input: string): string | null {
  const value = input.trim()
  if (!value || value.length > 2048) return null

  if (kind === 'email') {
    const address = value.replace(/^mailto:/i, '')
    const href = `mailto:${address}`
    return z.email().safeParse(address).success && isSafeLegalLink(href) ? href : null
  }
  if (kind === 'phone') {
    const number = value.replace(/^tel:/i, '').replace(/[\s().-]/g, '')
    const href = `tel:${number}`
    return isSafeLegalLink(href) ? href : null
  }

  // Keep existing HTTP and relative links; new bare domains default to HTTPS.
  if (/^(https?:|\/|\.\.?\/|#|\?)/i.test(value)) return isSafeLegalLink(value) ? value : null
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null
  const href = `https://${value}`
  return isSafeLegalLink(href) ? href : null
}

export function getLegalLinkAttributes(href: string) {
  return { href, target: /^https?:/i.test(href) ? '_blank' : null, rel: /^https?:/i.test(href) ? 'noopener noreferrer' : null }
}
