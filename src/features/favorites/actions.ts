'use server'

import { refresh, revalidatePath } from 'next/cache'
import 'server-only'
import { getSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { favoriteMutationSchema } from './schema'
import type { FavoriteMutationResult } from './types'

export async function setListingFavorite(listingId: unknown, isFavorited: unknown): Promise<FavoriteMutationResult> {
  const parsed = favoriteMutationSchema.safeParse({ listingId, isFavorited })
  if (!parsed.success) return { success: false, message: 'Invalid favorite request.' }

  let available: boolean
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Sign in to save listings.', requiresLogin: true }

    available = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({ where: { id: parsed.data.listingId, status: 'ACTIVE' }, select: { id: true } })
      if (!listing) return false

      const favorite = { userId: session.user.id, listingId: listing.id }
      if (parsed.data.isFavorited) {
        // An explicit desired state plus the unique constraint makes retries idempotent.
        await tx.favorite.createMany({ data: [favorite], skipDuplicates: true })
      } else {
        await tx.favorite.deleteMany({ where: favorite })
      }
      return true
    })
  } catch {
    console.error('Could not update favorite.')
    return { success: false, message: 'Could not update your favorites. Please try again.' }
  }

  if (!available) return { success: false, message: 'This listing is no longer available.' }

  // Favorite state and the detail count are request-time reads, outside the public catalog caches.
  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath('/account/favorites')
  refresh()

  return { success: true, data: { isFavorited: parsed.data.isFavorited } }
}
