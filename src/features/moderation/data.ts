import 'server-only'
import { getSettingsPageActor } from '@/features/account/settings/server'
import prisma from '@/lib/prisma'
import { moderationListingSelect, toModerationListing } from './listings/data'

export { getListingModerationQueue, getModerationListing } from './listings/data'
export { getModerationUsers } from './users/data'

export async function getModerationOverview() {
  await getSettingsPageActor(true)
  const [pendingListings, pendingNames, pendingAvatars, avatarCleanup, listings, openChatReports] = await Promise.all([
    prisma.listing.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { pendingName: { not: null } } }),
    prisma.user.count({ where: { pendingAvatarKey: { not: null } } }),
    prisma.user.count({ where: { avatarCleanupKey: { not: null } } }),
    prisma.listing.findMany({
      where: { status: 'PENDING' },
      select: moderationListingSelect,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 5
    }),
    prisma.chatReport.count({ where: { status: 'OPEN' } })
  ])

  return { pendingListings, pendingNames, pendingAvatars, avatarCleanup, openChatReports, recentListings: listings.map(toModerationListing) }
}
