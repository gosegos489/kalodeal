import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { canUseMarketplace } from './account-role'
import { hasActiveBan } from './ban-status'

// Recheck role and ban after preparation while the caller holds the user-row lock.
export async function isActiveMarketplaceUser(tx: Pick<Prisma.TransactionClient, 'user'>, userId: string) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true, banned: true, banExpires: true } })
  return !!user && canUseMarketplace(user.role) && !hasActiveBan(user)
}
