import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'

export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  return session
}

type Role = 'user' | 'moderator' | 'admin'

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
