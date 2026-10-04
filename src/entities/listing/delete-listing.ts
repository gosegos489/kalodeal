import { revalidatePath, updateTag } from 'next/cache'
import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { cacheTags } from '@/lib/cache-tags'
import { deleteListingPhotoObjects } from '@/lib/listing-photo-storage'

// The caller must authorize the actor before using this internal helper.
export async function deleteListingRecord(tx: Prisma.TransactionClient, where: { id: string; userId?: string }) {
  // Reuse owner deletion's lock: photo edits must finish before we read all keys.
  // An upload that loses this race compensates its own new objects.
  if (where.userId !== undefined) {
    await tx.$queryRaw`SELECT id FROM listing WHERE id = ${where.id} AND "userId" = ${where.userId} FOR UPDATE`
  } else {
    await tx.$queryRaw`SELECT id FROM listing WHERE id = ${where.id} FOR UPDATE`
  }
  const listing = await tx.listing.findFirst({
    where,
    select: { categoryId: true, images: { select: { key: true } } }
  })
  if (!listing) return null

  // Images, favorites, stats and daily views cascade. Conversations use SetNull,
  // retaining their title snapshot, messages and reports.
  const deleted = await tx.listing.deleteMany({ where })
  return deleted.count === 1 ? listing : null
}

// Call only after the database transaction commits, from a Server Action.
export async function finishListingDeletion(id: string, listing: NonNullable<Awaited<ReturnType<typeof deleteListingRecord>>>) {
  const photosCleaned = await deleteListingPhotoObjects(listing.images.map(({ key }) => key))
  let pagesRefreshed = true
  try {
    // Browse/search/home and both sitemap reads share the listings tag.
    updateTag(cacheTags.listings)
    updateTag(cacheTags.categories)
    updateTag(cacheTags.categoryListings(listing.categoryId))
    revalidatePath(`/listings/${id}`)
    // Favorites, analytics and conversations are uncached account reads.
    revalidatePath('/account', 'layout')
    revalidatePath('/moderator', 'layout')
    revalidatePath('/sell')
  } catch {
    console.error('Could not refresh pages after listing deletion.')
    pagesRefreshed = false
  }
  return { photosCleaned, pagesRefreshed }
}
