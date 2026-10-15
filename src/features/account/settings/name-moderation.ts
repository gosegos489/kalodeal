import { createHash } from 'node:crypto'
import 'server-only'
import { isActiveMarketplaceUser } from '@/lib/active-user'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'
import { AvatarError } from './avatar-lifecycle'
import { businessNameSchema, nameModerationSchema, profileSchema } from './schema'
import { getMarketplaceSettingsActor, getSettingsActor } from './server'

export function nameModerationVersion(name: string, updatedAt: Date) {
  return createHash('sha256')
    .update(JSON.stringify([name, updatedAt.toISOString()]))
    .digest('hex')
}

export async function submitProfileName(input: unknown) {
  const { name } = profileSchema.parse(input)
  const actor = await getMarketplaceSettingsActor()
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR UPDATE`
    const user = await tx.user.findUniqueOrThrow({ where: { id: actor.id }, select: { name: true } })
    // Empty explicitly removes the public name. There is no content to review.
    const pending = name !== '' && name !== user.name
    await tx.user.update({
      where: { id: actor.id },
      data: {
        ...(name === '' ? { name: '' } : {}),
        pendingName: pending ? name : null,
        nameModerationMessage: null
      }
    })
    return pending
  })
}

export async function submitBusinessName(input: unknown) {
  const { businessName } = businessNameSchema.parse(input)
  const actor = await getMarketplaceSettingsActor()
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${actor.id} FOR UPDATE`
    if (!(await isActiveMarketplaceUser(tx, actor.id))) throw new AvatarError('This account is unavailable.')
    const access = await getUserAccess(tx, actor.id)
    if (businessName && access.plan !== 'BUSINESS') throw new AvatarError('An active Business subscription is required.')
    const user = await tx.user.findUniqueOrThrow({ where: { id: actor.id }, select: { businessName: true } })
    const pending = businessName !== '' && businessName !== user.businessName
    await tx.user.update({
      where: { id: actor.id },
      data: {
        ...(businessName === '' ? { businessName: null } : {}),
        pendingBusinessName: pending ? businessName : null,
        businessNameModerationMessage: null
      }
    })
    return pending
  })
}

export async function reviewProfileName(input: unknown) {
  const review = nameModerationSchema.parse(input)
  await getSettingsActor(true)
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${review.userId} FOR UPDATE`
    const user = await tx.user.findUnique({ where: { id: review.userId }, select: { pendingName: true, pendingBusinessName: true, updatedAt: true } })
    // The client supplies only a version, never the name to publish. Any newer
    // profile mutation requires the moderator to review a fresh queue entry.
    const pendingName = review.kind === 'business-name' ? user?.pendingBusinessName : user?.pendingName
    if (!user || !pendingName || nameModerationVersion(pendingName, user.updatedAt) !== review.version) {
      throw new AvatarError('This pending name has changed. Refresh the moderation queue.')
    }
    await tx.user.update({
      where: { id: review.userId },
      data:
        review.kind === 'business-name'
          ? {
              ...(review.decision === 'approve' ? { businessName: pendingName } : {}),
              pendingBusinessName: null,
              businessNameModerationMessage: review.decision === 'request-changes' ? review.message : null
            }
          : {
              ...(review.decision === 'approve' ? { name: pendingName } : {}),
              pendingName: null,
              nameModerationMessage: review.decision === 'request-changes' ? review.message : null
            }
    })
  })
}
