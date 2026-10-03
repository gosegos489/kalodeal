import { revalidatePath } from 'next/cache'
import { AvatarError } from '@/features/account/settings/avatar-lifecycle'
import { AvatarBodyError, readAvatarFormData } from '@/features/account/settings/avatar-upload-body'
import { avatarFileSchema } from '@/features/account/settings/schema'
import { avatars, getMarketplaceSettingsActor } from '@/features/account/settings/server'
import { matchesImageType } from '@/lib/image-validation'
import { checkAvatarUploadRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    if (!origin || new URL(origin).host !== host) return Response.json({ success: false, message: 'Invalid request origin.' }, { status: 403 })
  } catch {
    return Response.json({ success: false, message: 'Invalid request origin.' }, { status: 403 })
  }

  try {
    const actor = await getMarketplaceSettingsActor()
    const limit = await checkAvatarUploadRateLimit(actor.id)
    if (!limit.success)
      return Response.json({ success: false, message: limit.message }, { status: limit.status, headers: { 'Retry-After': String(limit.retryAfter) } })
    const payload = await readAvatarFormData(request)
    const parsed = avatarFileSchema.safeParse(payload.get('avatar'))
    if (!parsed.success) return Response.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 })
    const file = parsed.data
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!matchesImageType(bytes, file.type))
      return Response.json({ success: false, message: 'Choose a valid JPEG, PNG or WebP image.' }, { status: 400 })
    await avatars.upload(actor.id, bytes, file.type)
    revalidatePath('/account/settings')
    revalidatePath('/listings/[id]', 'page')
    revalidatePath('/admin')
    revalidatePath('/moderator')
    return Response.json({ success: true, message: 'New avatar awaiting moderation.' })
  } catch (error) {
    if (error instanceof AvatarBodyError) return Response.json({ success: false, message: error.message }, { status: error.status })
    if (error instanceof AvatarError) return Response.json({ success: false, message: error.message }, { status: 403 })
    console.error('Avatar upload failed.', error instanceof Error ? error.name : 'Unknown error')
    return Response.json({ success: false, message: 'Could not upload your avatar. Please try again.' }, { status: 500 })
  }
}
