// Moderators use staff tools; admins retain their existing marketplace access.
export function canUseMarketplace(role?: string | null) {
  return role !== 'moderator'
}

export function getAccountDestination(role?: string | null) {
  return role === 'moderator' ? '/moderator' : '/account'
}
