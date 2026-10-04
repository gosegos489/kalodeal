import { hasActiveBan } from '@/lib/ban-status'

// Change this capability in one place to move grant management to admins later.
export function canManageAccessGrants(actor: { role?: string | null; banned?: boolean | null; banExpires?: Date | null }) {
  return (actor.role === 'moderator' || actor.role === 'admin') && !hasActiveBan(actor)
}
