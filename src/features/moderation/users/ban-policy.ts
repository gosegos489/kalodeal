type BanUser = { id: string; role?: string | null }

export function canManageUserBan(actor: BanUser, target: BanUser) {
  if (actor.id === target.id) return false
  if (actor.role === 'moderator') return target.role === 'user'
  return actor.role === 'admin' && (target.role === 'user' || target.role === 'moderator')
}
