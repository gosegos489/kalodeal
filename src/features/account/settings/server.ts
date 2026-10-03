import { redirect } from 'next/navigation'
import 'server-only'
import { canUseMarketplace } from '@/lib/account-role'
import { getSession } from '@/lib/auth-utils'
import { hasActiveBan } from '@/lib/ban-status'
import prisma from '@/lib/prisma'
import { AvatarError, createAvatarLifecycle } from './avatar-lifecycle'
import { avatarStorage } from './avatar-storage'

export async function getSettingsActor(moderator = false) {
  const session = await getSession(true)
  if (!session) throw new AvatarError('Please sign in to manage your account.')
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, banned: true, banExpires: true } })
  if (!user || hasActiveBan(user)) throw new AvatarError('This account is unavailable.')
  if (moderator && user.role !== 'moderator' && user.role !== 'admin') throw new AvatarError('Moderator access is required.')
  return user
}

export async function getSettingsPageActor(moderator = false) {
  try {
    return await getSettingsActor(moderator)
  } catch (error) {
    if (error instanceof AvatarError) redirect(moderator ? '/' : '/login')
    throw error
  }
}

export async function getMarketplaceSettingsActor() {
  const actor = await getSettingsActor()
  if (!canUseMarketplace(actor.role)) throw new AvatarError('Moderator accounts cannot manage seller profiles or avatars.')
  return actor
}

export const avatars = createAvatarLifecycle(
  {
    locked(userId, work) {
      return prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, image: true, pendingAvatarKey: true, avatarCleanupKey: true, avatarModerationMessage: true }
          })
          if (!user) throw new AvatarError('This account is unavailable.')
          return work(user, async (data) => {
            await tx.user.update({ where: { id: userId }, data })
          })
        },
        { maxWait: 10000, timeout: 20000 }
      )
    }
  },
  avatarStorage
)
