import 'server-only'
import { getPublicListingIds } from '@/entities/listing/public-eligibility'
import { Prisma } from '@/generated/prisma/client'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { getUserAccess } from '@/lib/user-access'

export class FeaturedError extends Error {}

export async function setFeaturedListing(tx: Prisma.TransactionClient, userId: string, listingId: string, selected: boolean) {
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
  if (!(await isActiveMarketplaceUser(tx, userId))) throw new FeaturedError('This account is unavailable.')
  await tx.$queryRaw`SELECT id FROM listing WHERE id = ${listingId} AND "userId" = ${userId} FOR UPDATE`
  const listing = await tx.listing.findFirst({ where: { id: listingId, userId }, select: { status: true, categoryId: true, featuredAt: true } })
  if (!listing) throw new FeaturedError('This listing is unavailable or does not belong to you.')
  if (selected) {
    const access = await getUserAccess(tx, userId)
    const slots = PLAN_LIMITS[access.plan].featuredSlots
    if (!slots) throw new FeaturedError('Featured Listing requires an active Business subscription.')
    if (listing.status !== 'ACTIVE') throw new FeaturedError('Only active listings can be featured.')
    if (!(await getPublicListingIds([listingId], tx)).has(listingId)) throw new FeaturedError('This listing exceeds your current plan allowance.')
    if (!listing.featuredAt) {
      const selections = await tx.listing.findMany({ where: { userId, status: 'ACTIVE', featuredAt: { not: null } }, select: { id: true } })
      const eligible = await getPublicListingIds(
        selections.map(({ id }) => id),
        tx
      )
      const stale = selections.filter(({ id }) => !eligible.has(id)).map(({ id }) => id)
      if (stale.length) {
        // Free obsolete selections without changing content versions.
        await tx.$executeRaw(Prisma.sql`UPDATE listing SET "featuredAt" = NULL WHERE id IN (${Prisma.join(stale)}) AND "userId" = ${userId}`)
      }
      const used = eligible.size
      if (used >= slots) throw new FeaturedError(`All ${slots} Featured Listing slots are in use. Deselect a listing first.`)
    }
  }
  // Explicit SQL keeps the content/moderation version unchanged. No Boost debit.
  await tx.$executeRaw`UPDATE listing SET "featuredAt" = ${selected ? (listing.featuredAt ?? new Date()) : null} WHERE id = ${listingId} AND "userId" = ${userId}`
  return listing.categoryId
}
