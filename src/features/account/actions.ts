'use server'

import 'server-only'
import { deleteListingRecord, finishListingDeletion } from '@/entities/listing/delete-listing'
import { listingIdSchema } from '@/entities/listing/schema'
import { canUseMarketplace } from '@/lib/account-role'
import type { ActionMessageResult } from '@/lib/action-result'
import { getMutationSession } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'

export async function deleteListing(id: unknown): Promise<ActionMessageResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let deletedListing: Awaited<ReturnType<typeof deleteListingRecord>>
  try {
    const session = await getMutationSession()
    if (!session) return { success: false, message: 'Sign in to delete your listing.' }
    if (!canUseMarketplace(session.user.role)) return { success: false, message: 'Moderator accounts cannot use marketplace actions.' }

    const where = { id: parsed.data, userId: session.user.id }
    deletedListing = await prisma.$transaction((tx) => deleteListingRecord(tx, where))
  } catch (error) {
    await captureServerException(error, { feature: 'listings', operation: 'delete', listingId: parsed.data })
    console.error('Could not delete listing.')
    return { success: false, message: 'Could not delete your listing. Please try again.' }
  }

  if (!deletedListing) return { success: false, message: 'This listing is unavailable or does not belong to you.' }

  const { photosCleaned, pagesRefreshed } = await finishListingDeletion(parsed.data, deletedListing)
  const warnings = [!photosCleaned && 'Some stored photos could not be removed.', !pagesRefreshed && 'Reload to see the updated listings.'].filter(
    Boolean
  )
  return { success: true, message: ['Your listing has been deleted.', ...warnings].join(' ') }
}
