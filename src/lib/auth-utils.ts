import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import 'server-only'
import { auth } from './auth'

type Role = 'user' | 'moderator' | 'admin'

export async function getSession() {
  return auth.api.getSession({
    headers: await headers()
  })
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
  const session = await requireUser()

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
