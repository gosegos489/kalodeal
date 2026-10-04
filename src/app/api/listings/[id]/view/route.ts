import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { listingIdSchema } from '@/entities/listing/schema'
import { recordListingView } from '@/features/listing-views/record-view'
import { getSession } from '@/lib/auth-utils'
import { checkListingViewRateLimit, getRateLimitIp } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'

const VIEW_COOKIE = 'kalodeal-browser'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = request.headers.get('origin')
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    if (!origin || new URL(origin).host !== host) return new Response(null, { status: 403 })
  } catch {
    return new Response(null, { status: 403 })
  }
  try {
    const { id } = await params
    const parsed = listingIdSchema.safeParse(id)
    if (!parsed.success) return new Response(null, { status: 400 })
    const rateLimit = await checkListingViewRateLimit(getRateLimitIp(request.headers))
    if (!rateLimit.success) return new Response(null, { status: rateLimit.status, headers: { 'Retry-After': String(rateLimit.retryAfter) } })
    const session = await getSession()
    const cookieStore = await cookies()
    const existing = cookieStore.get(VIEW_COOKIE)?.value
    const identifier = existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing) ? existing : randomUUID()
    await recordListingView(parsed.data, session?.user.id ?? null, identifier)
    if (identifier !== existing)
      cookieStore.set(VIEW_COOKIE, identifier, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    await captureServerException(error, { feature: 'listing-views', operation: 'record' })
    console.error('Could not record listing view.')
    return new Response(null, { status: 503 })
  }
}
