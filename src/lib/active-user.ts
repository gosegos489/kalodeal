import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { hasActiveBan } from './ban-status'

// Recheck bans after preparation while the caller holds the user-row lock.
export async function isUnbannedUser(tx: Pick<Prisma.TransactionClient, 'user'>, userId: string) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { banned: true, banExpires: true } })
  return !!user && !hasActiveBan(user)
}
