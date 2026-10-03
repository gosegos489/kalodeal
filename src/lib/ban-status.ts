type BanStatus = { banned?: boolean | null; banExpires?: Date | null }

// Better Auth clears expired bans at the next sign-in. Reads must also treat
// an elapsed expiry as inactive while that stored flag is awaiting cleanup.
export function hasActiveBan(user: BanStatus, now = Date.now()) {
  return !!user.banned && (!user.banExpires || user.banExpires.getTime() > now)
}
