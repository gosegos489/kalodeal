export const BUMP_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function getBumpCooldownRemainingMs(bumpedAt: Date | null, now = new Date()) {
  return bumpedAt ? Math.max(0, bumpedAt.getTime() + BUMP_COOLDOWN_MS - now.getTime()) : 0
}
