import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { avatarKey } from '@/features/account/settings/avatar-reference'
import { avatarStorage } from '@/features/account/settings/avatar-storage'
import { avatarModerationSchema } from '@/features/account/settings/schema'
import { getSettingsActor } from '@/features/account/settings/server'
import prisma from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string; version: string }> }) {
  try {
    const actor = await getSettingsActor()
    const parsed = avatarModerationSchema.pick({ userId: true, version: true }).safeParse(await params)
    if (!parsed.success) return new Response(null, { status: 404 })
    const { userId, version } = parsed.data
    if (actor.id !== userId && actor.role !== 'moderator' && actor.role !== 'admin') return new Response(null, { status: 404 })
    const key = avatarKey(userId, version)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pendingAvatarKey: true } })
    if (user?.pendingAvatarKey !== key) return new Response(null, { status: 404 })
    const { bytes, type } = await avatarStorage.read(key)
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'private, no-store',
        Vary: 'Cookie',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'"
      }
    })
  } catch (error) {
    return new Response(null, { status: error instanceof AvatarError ? 401 : 404, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
