import 'server-only'
import { getListingImageUrl, listingSummarySelect, toListingSummary } from '@/entities/listing/listing-summary'
import { listingIdSchema } from '@/entities/listing/schema'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { getSettingsPageActor } from '@/features/account/settings/server'
import type { Prisma } from '@/generated/prisma/client'
import { hasActiveBan } from '@/lib/ban-status'
import { getPagination } from '@/lib/pagination'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import prisma from '@/lib/prisma'
import { canManageUserBan } from './ban-policy'
import { type ModerationSearchParams, getModerationQuery, listingModerationWhere, userSearchWhere } from './search'

const moderationListingSelect = {
  ...listingSummarySelect,
  status: true,
  user: { select: { name: true, email: true } }
} satisfies Prisma.ListingSelect

function toModerationListing({ user, ...listing }: Prisma.ListingGetPayload<{ select: typeof moderationListingSelect }>) {
  return { ...toListingSummary(listing), status: listing.status, seller: { name: getSellerName(user.name), email: user.email } }
}

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

export async function getListingModerationQueue(params: ModerationSearchParams = {}) {
  await getSettingsPageActor(true)
  const where = listingModerationWhere(params)
  const totalItems = await prisma.listing.count({ where })
  const pagination = getPagination({ pageParam: params.page, totalItems })
  const listings = await prisma.listing.findMany({
    where,
    select: moderationListingSelect,
    orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    skip: pagination.skip,
    take: pagination.take
  })

  return { listings: listings.map(toModerationListing), ...pagination }
}

export async function getModerationUsers(params: ModerationSearchParams = {}) {
  const actor = await getSettingsPageActor(true)
  const where = userSearchWhere(getModerationQuery(params.q))
  const totalItems = await prisma.user.count({ where })
  const pagination = getPagination({ pageParam: params.page, totalItems })
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, image: true, role: true, banned: true, banReason: true, banExpires: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: pagination.skip,
    take: pagination.take
  })
  return {
    ...pagination,
    users: users.map((user) => ({
      id: user.id,
      name: getSellerName(user.name),
      email: user.email,
      role: user.role,
      avatarUrl: getApprovedAvatarUrl(user.id, user.image),
      banned: hasActiveBan(user),
      banReason: user.banReason,
      banExpires: user.banExpires?.toISOString() ?? null,
      expired: !!user.banned && !hasActiveBan(user),
      canManageBan: canManageUserBan(actor, user)
    }))
  }
}

export async function getModerationListing(id: unknown) {
  await getSettingsPageActor(true)
  const parsed = listingIdSchema.safeParse(id)
  if (!parsed.success) return null

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data },
    select: {
      ...moderationListingSelect,
      updatedAt: true,
      phone: true,
      youtube: true,
      facebookUrl: true,
      messengerUrl: true,
      images: {
        select: { id: true, key: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: PLAN_LIMITS.PRO.imagesPerListing
      }
    }
  })
  if (!listing) return null

  return {
    ...toModerationListing(listing),
    updatedAt: listing.updatedAt.toISOString(),
    phone: listing.phone,
    youtube: listing.youtube,
    facebookUrl: listing.facebookUrl,
    messengerUrl: listing.messengerUrl,
    images: listing.images.flatMap(({ id: imageId, key }) => {
      const url = getListingImageUrl(key)
      return url ? [{ id: imageId, url }] : []
    })
  }
}
