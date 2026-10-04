import { redirect } from 'next/navigation'
import 'server-only'
import { getMutationSession } from '@/lib/auth-utils'
import { AccessGrantError } from './error'
import { canManageAccessGrants } from './permission'

export async function getAccessGrantManager() {
  const session = await getMutationSession()
  if (!session || !canManageAccessGrants(session.user)) throw new AccessGrantError('You cannot manage access grants.')
  return { id: session.user.id }
}

export async function requireAccessGrantManager() {
  const session = await getMutationSession()
  if (!session) redirect('/login')
  if (!canManageAccessGrants(session.user)) redirect('/')
  return { id: session.user.id }
}
