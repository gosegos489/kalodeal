import { createHash } from 'node:crypto'
import 'server-only'
import prisma from '@/lib/prisma'
import { AvatarError } from './avatar-lifecycle'
import { nameModerationSchema, profileSchema } from './schema'
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

export async function reviewProfileName(input: unknown) {
  const review = nameModerationSchema.parse(input)
  await getSettingsActor(true)
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${review.userId} FOR UPDATE`
    const user = await tx.user.findUnique({ where: { id: review.userId }, select: { pendingName: true, updatedAt: true } })
    // The client supplies only a version, never the name to publish. Any newer
    // profile mutation requires the moderator to review a fresh queue entry.
    if (!user?.pendingName || nameModerationVersion(user.pendingName, user.updatedAt) !== review.version) {
      throw new AvatarError('This pending name has changed. Refresh the moderation queue.')
    }
    await tx.user.update({
      where: { id: review.userId },
      data: {
        ...(review.decision === 'approve' ? { name: user.pendingName } : {}),
        pendingName: null,
        nameModerationMessage: review.decision === 'request-changes' ? review.message : null
      }
    })
  })
}
