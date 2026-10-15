import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { listingSummarySelect, toListingSummary } from './listing-summary'
import { getPublicListingIds } from './public-eligibility'
import type { ListingSummary } from './types'

// Always request-time: time expiry must stop priority even without a webhook/cache purge.
export async function getFeaturedListings(where: Prisma.ListingWhereInput, take: number) {
  const now = new Date()
  const candidates = await prisma.listing.findMany({
    where: {
      AND: [
        where,
        {
          status: 'ACTIVE',
          featuredAt: { not: null },
          user: {
            subscription: {
              is: { plan: 'BUSINESS', status: { in: ['ACTIVE', 'CANCELED'] }, currentPeriodStart: { lte: now }, currentPeriodEnd: { gt: now } }
            }
          }
        }
      ]
    },
    select: { ...listingSummarySelect, userId: true },
    orderBy: [{ featuredAt: 'asc' }, { id: 'asc' }],
    take: 50
  })
  const visible = await getPublicListingIds(candidates.map(({ id }) => id))
  const byOwner = new Map<string, number>()
  const result: ListingSummary[] = []
  for (const { userId, ...listing } of candidates) {
    if (!visible.has(listing.id)) continue
    if (result.length >= Math.floor(take / 4)) break
    const used = byOwner.get(userId) ?? 0
    if (used >= 2) continue
    byOwner.set(userId, used + 1)
    result.push(toListingSummary(listing))
  }
  return result
}
