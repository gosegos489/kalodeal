import { createHash } from 'node:crypto'

export function getViewDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function getVisitorHash(identifier: string, listingId: string, day: Date) {
  // The cookie is random, not a user ID/IP. Scope its hash so analytics cannot link browsing across listings/days.
  return createHash('sha256').update(`${identifier}:${listingId}:${day.toISOString()}`).digest('hex')
}
