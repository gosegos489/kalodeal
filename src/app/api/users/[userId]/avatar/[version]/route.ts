import { approvedAvatarUrl, avatarKey } from '@/features/account/settings/avatar-reference'
import { avatarStorage } from '@/features/account/settings/avatar-storage'
import { avatarReferenceSchema } from '@/features/account/settings/schema'
import prisma from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string; version: string }> }) {
  const parsed = avatarReferenceSchema.safeParse(await params)
  if (!parsed.success) return new Response(null, { status: 404 })
  const { userId, version } = parsed.data
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } })
  // Only the approved reference can authorize a public image. Pending fields
  // are deliberately absent from this query, and all URLs are version-specific.
  if (user?.image !== approvedAvatarUrl(userId, version)) return new Response(null, { status: 404 })
  try {
    const { bytes, type } = await avatarStorage.read(avatarKey(userId, version))
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'"
      }
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
