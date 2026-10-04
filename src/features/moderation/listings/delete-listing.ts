'use server'

import 'server-only'
import { deleteListingRecord, finishListingDeletion } from '@/entities/listing/delete-listing'
import { listingIdSchema } from '@/entities/listing/schema'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { getSettingsActor } from '@/features/account/settings/server'
import type { ActionMessageResult } from '@/lib/action-result'
import { hasActiveBan } from '@/lib/ban-status'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'

type ModeratorDeleteListingResult = ActionMessageResult & { unavailable?: boolean; warning?: string }

export async function deleteModeratedListing(id: unknown): Promise<ModeratorDeleteListingResult> {
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return { success: false, message: 'Invalid listing.' }

  let deletedListing: Awaited<ReturnType<typeof deleteListingRecord>>
  try {
    // Existing moderation RBAC: fresh session, persisted role and current ban.
    const actor = await getSettingsActor(true)
    const result = await prisma.$transaction(async (tx): Promise<{ message: string } | { listing: typeof deletedListing }> => {
      // Match moderateListing's authorization lock and recheck. Role/ban writes
      // cannot commit between this check and the permanent deletion.
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR SHARE`
      const moderator = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, banned: true, banExpires: true } })
      if (!moderator || hasActiveBan(moderator) || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
        return { message: 'Moderator access is required.' }
      }
      // Staff listing.delete permission applies to every status/current version.
      // Client IDs identify the target; they never grant marketplace ownership.
      return { listing: await deleteListingRecord(tx, { id: parsed.data }) }
    })
    if ('message' in result) return { success: false, message: result.message }
    deletedListing = result.listing
  } catch (error) {
    if (error instanceof AvatarError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'listing-moderation', operation: 'delete', listingId: parsed.data })
    console.error('Could not permanently delete listing from moderation.')
    return { success: false, message: 'Could not delete this listing. Please try again.' }
  }

  if (!deletedListing) return { success: false, message: 'This listing is no longer available.', unavailable: true }

  const { photosCleaned, pagesRefreshed } = await finishListingDeletion(parsed.data, deletedListing)
  const warnings = [!photosCleaned && 'Some stored photos could not be removed.', !pagesRefreshed && 'Reload to see the updated listings.'].filter(
    Boolean
  )
  return { success: true, message: 'Listing deleted permanently.', ...(warnings.length ? { warning: warnings.join(' ') } : {}) }
}
