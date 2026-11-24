import { toNextJsHandler } from 'better-auth/next-js'
import type { NextRequest } from 'next/server'
import { getAuthEmailLocale } from '@/features/auth/email-locale'
import { getAuthHref } from '@/features/auth/login-redirect'
import { auth } from '@/lib/auth'

const handlers = toNextJsHandler(auth)
export const POST = handlers.POST

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request)
  if (response.status !== 302 || request.nextUrl.pathname !== '/api/auth/verify-email') return response

  // Better Auth sends verification errors to the success callback, which can be a guest-inaccessible page.
  const location = response.headers.get('location')
  const destination = location && new URL(location, request.url)
  if (destination && destination.searchParams.get('error') === 'TOKEN_EXPIRED') {
    destination.searchParams.delete('error')
    const login = new URL(getAuthHref('/login', getAuthEmailLocale(request.url), destination.pathname + destination.search), request.url)
    login.searchParams.set('error', 'TOKEN_EXPIRED')
    const headers = new Headers(response.headers)
    headers.set('location', login.pathname + login.search)
    return new Response(response.body, { status: response.status, headers })
  }
  return response
}
