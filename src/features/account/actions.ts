'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import 'server-only'
import { listingIdSchema } from '@/entities/listing/schema'
import type { ActionMessageResult } from '@/lib/action-result'
import { getSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { deleteListingPhotoObjects } from '@/lib/listing-photo-storage'
import prisma from '@/lib/prisma'

export async function deleteListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let deletedListing: { categoryId: string; images: { key: string }[] } | null
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Sign in to delete your listing.' }

    const where = { id: parsed.data, userId: session.user.id }
    deletedListing = await prisma.$transaction(async (tx) => {
      // Read keys after acquiring the same listing lock as photo management.
      // Otherwise a concurrent upload could commit between this read and cascade deletion.
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${parsed.data} AND "userId" = ${session.user.id} FOR UPDATE`
      const listing = await tx.listing.findFirst({
        where,
        select: { categoryId: true, images: { select: { key: true } } }
      })
      if (!listing) return null

      const deleted = await tx.listing.deleteMany({ where })
      return deleted.count === 1 ? listing : null
    })
  } catch {
    console.error('Could not delete listing.')
    return { success: false, message: 'Could not delete your listing. Please try again.' }
  }

  if (!deletedListing) return { success: false, message: 'This listing is unavailable or does not belong to you.' }

  await deleteListingPhotoObjects(deletedListing.images.map(({ key }) => key))

  revalidateTag(cacheTags.listings, { expire: 0 })
  revalidateTag(cacheTags.categories, { expire: 0 })
  revalidateTag(cacheTags.categoryListings(deletedListing.categoryId), { expire: 0 })
  revalidatePath(`/listings/${parsed.data}`)
  revalidatePath('/account', 'layout')
  revalidatePath('/sell')

  return { success: true, message: 'Your listing has been deleted.' }
}
