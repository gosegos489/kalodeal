import 'server-only'
import prisma from '@/lib/prisma'
import { getViewDay, getVisitorHash } from './view-identity'

export async function recordListingView(listingId: string, userId: string | null, identifier: string) {
  const day = getViewDay()
  const visitorHash = getVisitorHash(identifier, listingId, day)
  return prisma.$transaction(async (tx) => {
    // Lock the listing to keep visibility/ownership, uniqueness and the aggregate consistent with deletion/moderation.
    const listings = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM listing WHERE id = ${listingId} AND status = 'ACTIVE'
      AND "userId" <> ${userId ?? ''} FOR UPDATE
    `
    if (!listings.length) return false
    const inserted = await tx.listingDailyView.createMany({ data: [{ listingId, visitorHash, day }], skipDuplicates: true })
    if (inserted.count === 0) return false
    await tx.listingStats.upsert({
      where: { listingId },
      create: { listingId, views: 1 },
      update: { views: { increment: 1 } }
    })
    return true
  })
}
