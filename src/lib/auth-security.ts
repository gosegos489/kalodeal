import { APIError, getAuthoritativeSessionFromCtx } from 'better-auth/api'
import 'server-only'
import { canManageUserBan } from '@/features/moderation/ban-policy'
import { banEndpointSchema, unbanUserSchema } from '@/features/moderation/ban-schema'
import { hasActiveBan } from './ban-status'

type AuthContext = Parameters<typeof getAuthoritativeSessionFromCtx>[0]
const sensitivePaths = new Set([
  '/update-user',
  '/change-password',
  '/change-email',
  '/delete-user',
  '/revoke-session',
  '/revoke-sessions',
  '/revoke-other-sessions'
])

export async function authorizeAuthMutation(ctx: AuthContext) {
  if (!ctx.path?.startsWith('/admin/') && !sensitivePaths.has(ctx.path ?? '')) return
  const session = await getAuthoritativeSessionFromCtx(ctx)
  if (!session) throw new APIError('UNAUTHORIZED', { message: 'Please sign in again.' })
  if (hasActiveBan({ banned: session.user.banned, banExpires: session.user.banExpires })) {
    throw new APIError('FORBIDDEN', { code: 'BANNED_USER', message: 'Your account is suspended.' })
  }
  if (ctx.path !== '/admin/ban-user' && ctx.path !== '/admin/unban-user') return

  const parsed = (ctx.path === '/admin/ban-user' ? banEndpointSchema : unbanUserSchema).safeParse(ctx.body)
  if (!parsed.success) throw new APIError('BAD_REQUEST', { message: parsed.error.issues[0].message })
  const target = await ctx.context.internalAdapter.findUserById(parsed.data.userId)
  if (!target) throw new APIError('NOT_FOUND', { message: 'This user is no longer available.' })
  if (!canManageUserBan(session.user, target)) {
    throw new APIError('FORBIDDEN', { message: 'You cannot manage bans for this user.' })
  }
  return parsed.data
}

export function normalizeBanUpdate(data: Record<string, unknown>, path?: string) {
  // Better Auth otherwise passes undefined, which leaves an earlier temporary
  // expiry in Prisma when changing that ban to permanent.
  return path === '/admin/ban-user' && data.banExpires === undefined ? { ...data, banExpires: null } : data
}
