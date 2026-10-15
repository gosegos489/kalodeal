import { revalidatePath, revalidateTag } from 'next/cache'
import { CategoryIconError } from '@/features/moderation/categories/icon-workflow'
import { CATEGORY_ICON_BODY_MAX_BYTES, categoryIdSchema } from '@/features/moderation/categories/schema'
import { categoryIcons } from '@/features/moderation/categories/server'
import { getMutationSession } from '@/lib/auth-utils'
import { cacheTags } from '@/lib/cache-tags'
import { checkCategoryIconRateLimit } from '@/lib/rate-limit'
import { MultipartBodyError, readMultipartFormData } from '@/lib/read-multipart-form-data'
import { captureServerException } from '@/lib/sentry-server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    if (!origin || new URL(origin).host !== host) return Response.json({ success: false, message: 'Invalid request origin.' }, { status: 403 })
  } catch {
    return Response.json({ success: false, message: 'Invalid request origin.' }, { status: 403 })
  }
  try {
    const session = await getMutationSession()
    if (!session) throw new CategoryIconError('Sign in with an administrator account.', 401)
    if (session.user.role !== 'admin') throw new CategoryIconError('Administrator access is required.', 403)
    const { id } = await params
    if (!categoryIdSchema.safeParse(id).success) throw new CategoryIconError('Invalid category.')
    const limit = await checkCategoryIconRateLimit(session.user.id)
    if (!limit.success)
      return Response.json({ success: false, message: limit.message }, { status: limit.status, headers: { 'Retry-After': String(limit.retryAfter) } })
    const body = await readMultipartFormData(request, CATEGORY_ICON_BODY_MAX_BYTES, 'Invalid icon upload.', 'Use an icon no larger than 1 MB.')
    if (
      [...body.keys()].some((key) => !['operation', 'updatedAt', 'icon'].includes(key)) ||
      ['operation', 'updatedAt', 'icon'].some((key) => body.getAll(key).length > 1)
    )
      throw new CategoryIconError('Invalid icon upload.')
    const result = await categoryIcons.save(
      { categoryId: id, operation: body.get('operation'), updatedAt: body.get('updatedAt') },
      body.get('icon') ?? undefined
    )
    let message = result.cleaned ? 'Category icon saved.' : 'Category icon saved. Storage cleanup needs attention.'
    try {
      revalidateTag(cacheTags.categories, { expire: 0 })
      revalidatePath('/moderator/categories', 'page')
      revalidatePath(`/moderator/categories/${id}`)
    } catch (error) {
      await captureServerException(error, { feature: 'category-icons', operation: 'refresh' })
      message += ' Public category refresh needs attention.'
    }
    return Response.json({ success: true, message, icon: result.icon, updatedAt: result.updatedAt })
  } catch (error) {
    if (error instanceof CategoryIconError || error instanceof MultipartBodyError)
      return Response.json({ success: false, message: error.message }, { status: error.status })
    await captureServerException(error, { feature: 'category-icons', operation: 'save' })
    return Response.json({ success: false, message: 'Could not save this icon. Reload the page before trying again.' }, { status: 500 })
  }
}
