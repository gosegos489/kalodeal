import 'server-only'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import type { ModerationSearchParams } from '@/features/moderation/shared/search'
import { getModerationUsers } from '@/features/moderation/users/data'
import { hasActiveBan } from '@/lib/ban-status'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { getUserAccess } from '@/lib/user-access'
import { grantUserIdSchema } from './schema'
import { requireAccessGrantManager } from './server'

const userSelect = { id: true, name: true, email: true, image: true, role: true, banned: true, banExpires: true } as const

function displayUser(user: {
  id: string
  name: string
  email: string
  image: string | null
  role: string | null
  banned: boolean | null
  banExpires: Date | null
}) {
  return {
    id: user.id,
    name: getSellerName(user.name),
    email: user.email,
    avatarUrl: getApprovedAvatarUrl(user.id, user.image),
    role: user.role,
    banned: hasActiveBan(user)
  }
}

export async function getAccessGrantUsers(params: ModerationSearchParams) {
  await requireAccessGrantManager()
  return getModerationUsers(params)
}

export type GrantHistoryParams = { proPage?: string | string[]; bumpsPage?: string | string[] }

export async function getAccessGrantUser(userId: unknown, params: GrantHistoryParams = {}) {
  await requireAccessGrantManager()
  const parsed = grantUserIdSchema.safeParse(userId)
  if (!parsed.success) return null
  const user = await prisma.user.findUnique({ where: { id: parsed.data }, select: userSelect })
  if (!user) return null
  const where = { userId: user.id }
  const [access, proTotal, bumpsTotal] = await Promise.all([
    getUserAccess(prisma, user.id),
    prisma.planGrant.count({ where }),
    prisma.bumpGrant.count({ where })
  ])
  const proPagination = getPagination({ totalItems: proTotal, pageParam: params.proPage })
  const bumpsPagination = getPagination({ totalItems: bumpsTotal, pageParam: params.bumpsPage })
  const issuer = { select: { email: true } } as const
  const [proGrants, bumpGrants] = await Promise.all([
    prisma.planGrant.findMany({
      where,
      select: { id: true, plan: true, startsAt: true, endsAt: true, revokedAt: true, createdAt: true, reason: true, grantedBy: issuer },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: proPagination.skip,
      take: proPagination.take
    }),
    prisma.bumpGrant.findMany({
      where,
      select: { id: true, total: true, remaining: true, expiresAt: true, createdAt: true, reason: true, grantedBy: issuer },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: bumpsPagination.skip,
      take: bumpsPagination.take
    })
  ])
  return { user: displayUser(user), access, proGrants, bumpGrants, proPagination, bumpsPagination, now: new Date() }
}
