import 'server-only'
import { getSellerName } from '@/entities/user/public-profile'
import { getApprovedAvatarUrl } from '@/features/account/settings/avatar-reference'
import { getSettingsPageActor } from '@/features/account/settings/server'
import { hasActiveBan } from '@/lib/ban-status'
import { getPagination } from '@/lib/pagination'
import prisma from '@/lib/prisma'
import { type ModerationSearchParams, getModerationQuery, userSearchWhere } from '../shared/search'
import { canManageUserBan } from './ban-policy'

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
