import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import { hasActiveBan } from '@/lib/ban-status'
import prisma from '@/lib/prisma'
import { checkProfileUpdateRateLimit } from '@/lib/rate-limit'
import { AvatarError } from './avatar-lifecycle'
import { businessDetailsSchema, businessReviewSchema, emptyBusinessDetails } from './business-schema'
import { nameModerationVersion } from './name-moderation'
import { getMarketplaceSettingsActor, getSettingsActor } from './server'

async function owner() {
  const actor = await getMarketplaceSettingsActor()
  const limit = await checkProfileUpdateRateLimit(actor.id)
  if (!limit.success) throw new AvatarError(limit.message)
  return actor
}

export async function convertToBusiness() {
  const actor = await owner()
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR UPDATE`
    if (!(await isActiveMarketplaceUser(tx, actor.id))) throw new AvatarError('This account is unavailable.')
    await tx.user.update({ where: { id: actor.id }, data: { accountType: 'BUSINESS' } })
    await tx.businessProfile.upsert({ where: { userId: actor.id }, create: { userId: actor.id }, update: {} })
  })
}

export async function submitBusinessDetails(input: unknown) {
  const details = businessDetailsSchema.parse(input)
  const actor = await owner()
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR UPDATE`
    if (!(await isActiveMarketplaceUser(tx, actor.id))) throw new AvatarError('This account is unavailable.')
    const user = await tx.user.findUniqueOrThrow({ where: { id: actor.id }, select: { accountType: true } })
    if (user.accountType !== 'BUSINESS') throw new AvatarError('Switch to a Business Account first.')
    const profile = await tx.businessProfile.findUnique({
      where: { userId: actor.id },
      select: { description: true, address: true, website: true, openingHours: true }
    })
    const approved = profile
      ? {
          description: profile.description ?? '',
          address: profile.address ?? '',
          website: profile.website ?? '',
          openingHours: profile.openingHours ?? ''
        }
      : emptyBusinessDetails
    // Clearing a public field needs no review. New non-empty content stays pending.
    const pending = Object.entries(details).some(([key, value]) => value !== '' && value !== approved[key as keyof typeof approved])
    const clears = {
      ...(details.description === '' ? { description: null } : {}),
      ...(details.address === '' ? { address: null } : {}),
      ...(details.website === '' ? { website: null } : {}),
      ...(details.openingHours === '' ? { openingHours: null } : {})
    }
    await tx.businessProfile.upsert({
      where: { userId: actor.id },
      create: { userId: actor.id, pendingDetails: pending ? details : Prisma.DbNull },
      update: { ...clears, pendingDetails: pending ? details : Prisma.DbNull, moderationMessage: null }
    })
    return pending
  })
}

export async function reviewBusinessDetails(input: unknown) {
  const review = businessReviewSchema.parse(input)
  const actor = await getSettingsActor(true)
  await prisma.$transaction(async (tx) => {
    // All business profile writes use the same owner lock as profile/billing writes.
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${review.userId} FOR UPDATE`
    const staff = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true, banned: true, banExpires: true } })
    if (!staff || hasActiveBan(staff) || !['moderator', 'admin'].includes(staff.role ?? '')) throw new AvatarError('Moderator access is required.')
    const profile = await tx.businessProfile.findUnique({ where: { userId: review.userId }, select: { pendingDetails: true, updatedAt: true } })
    const pending = businessDetailsSchema.safeParse(profile?.pendingDetails)
    if (!profile || !pending.success || nameModerationVersion(JSON.stringify(pending.data), profile.updatedAt) !== review.version) {
      throw new AvatarError('This business profile has changed. Refresh the moderation queue.')
    }
    await tx.businessProfile.update({
      where: { userId: review.userId },
      data: {
        ...(review.decision === 'approve'
          ? {
              description: pending.data.description || null,
              address: pending.data.address || null,
              website: pending.data.website || null,
              openingHours: pending.data.openingHours || null
            }
          : {}),
        pendingDetails: Prisma.DbNull,
        moderationMessage: review.decision === 'request-changes' ? review.message : null
      }
    })
  })
}
