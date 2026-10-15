import 'server-only'
import { getModerationQuery, userSearchWhere } from '@/features/moderation/shared/search'
import { Prisma } from '@/generated/prisma/client'

export function profileModerationWhere(query?: string | string[]): Prisma.UserWhereInput {
  const text = getModerationQuery(query)
  const search = text
    ? {
        OR: [
          userSearchWhere(text),
          { pendingName: { contains: text, mode: 'insensitive' as const } },
          { pendingBusinessName: { contains: text, mode: 'insensitive' as const } }
        ]
      }
    : {}
  return {
    AND: [
      {
        OR: [
          { pendingName: { not: null } },
          { pendingBusinessName: { not: null } },
          { businessProfile: { is: { pendingDetails: { not: Prisma.DbNull } } } },
          { pendingAvatarKey: { not: null } },
          { avatarCleanupKey: { not: null } }
        ]
      },
      search
    ]
  }
}
