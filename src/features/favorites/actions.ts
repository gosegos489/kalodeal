'use server'

import { refresh, revalidatePath } from 'next/cache'
import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { favoriteMutationSchema } from './schema'
import type { FavoriteMutationResult } from './types'

export async function setListingFavorite(listingId: unknown, isFavorited: unknown): Promise<FavoriteMutationResult> {
  const parsed = favoriteMutationSchema.safeParse({ listingId, isFavorited })
  if (!parsed.success) return { success: false, message: 'Invalid favorite request.' }

  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to save listings.', requiresLogin: true }

    const favorite = { userId: session.user.id, listingId: parsed.data.listingId }
    if (parsed.data.isFavorited) {
      const listing = await prisma.listing.findFirst({ where: { id: parsed.data.listingId, status: 'ACTIVE' }, select: { id: true } })
      if (!listing) return { success: false, message: 'This listing is no longer available.' }

      // An explicit desired state plus the unique constraint makes retries idempotent.
      await prisma.favorite.createMany({ data: [favorite], skipDuplicates: true })
    } else {
      await prisma.favorite.deleteMany({ where: favorite })
    }
  } catch {
    console.error('Could not update favorite.')
    return { success: false, message: 'Could not update your favorites. Please try again.' }
  }

  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath('/account/favorites')
  refresh()

  return { success: true, data: { isFavorited: parsed.data.isFavorited } }
}
