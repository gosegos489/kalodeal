import 'server-only'
import { cache } from 'react'
import { getSettingsActor, getSettingsPageActor } from '@/features/account/settings/server'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { moderationListingSelect, toModerationListing } from './listings/data'

export { getListingModerationQueue, getModerationListing } from './listings/data'
export { getModerationUsers } from './users/data'

export const getModerationQueueCounts = cache(async () => {
  await getSettingsActor(true)
  const [pendingListings, pendingAvatars] = await Promise.all([
    prisma.listing.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { pendingAvatarKey: { not: null } } })
  ])
  return { pendingListings, pendingAvatars }
})

export async function getModerationOverview() {
  await getSettingsPageActor(true)
  const [counts, pendingNames, avatarCleanup, listings, openChatReports] = await Promise.all([
    getModerationQueueCounts(),
    prisma.user.count({
      where: {
        OR: [
          { pendingName: { not: null } },
          { pendingBusinessName: { not: null } },
          { businessProfile: { is: { pendingDetails: { not: Prisma.DbNull } } } }
        ]
      }
    }),
    prisma.user.count({ where: { avatarCleanupKey: { not: null } } }),
    prisma.listing.findMany({
      where: { status: 'PENDING' },
      select: moderationListingSelect,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 5
    }),
    prisma.chatReport.count({ where: { status: 'OPEN' } })
  ])

  return { ...counts, pendingNames, avatarCleanup, openChatReports, recentListings: listings.map(toModerationListing) }
}
