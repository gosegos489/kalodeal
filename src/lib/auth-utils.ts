import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import 'server-only'
import { auth } from './auth'
import { hasActiveBan } from './ban-status'

type Role = 'user' | 'moderator' | 'admin'

export async function getAuthHeaders() {
  const requestHeaders = new Headers(await headers())
  // Server Actions can rotate auth cookies. RSC reads after the action must use
  // the current cookie store, rather than the request's now revoked token.
  requestHeaders.set('cookie', (await cookies()).toString())
  return requestHeaders
}

export async function getSession(disableCookieCache = false) {
  return auth.api.getSession({
    headers: await getAuthHeaders(),
    query: { disableCookieCache }
  })
}

export async function getMutationSession() {
  const session = await getSession(true)
  return session && !hasActiveBan(session.user) ? session : null
}

export async function requireGuest() {
  const session = await getSession()

  if (session) {
    redirect('/account')
  }
}

export async function requireUser() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

export async function requireRole(roles: Role[]) {
  const session = await getMutationSession()
  if (!session) redirect('/login')

  if (!session.user.role || !roles.includes(session.user.role as Role)) {
    redirect('/')
  }

  return session
}

export function requireModerator() {
  return requireRole(['moderator', 'admin'])
}

export function requireAdmin() {
  return requireRole(['admin'])
}
