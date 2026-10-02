const versionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function avatarKey(userId: string, version: string) {
  if (!versionPattern.test(version)) throw new Error('Invalid avatar version.')
  return `users/${encodeURIComponent(userId)}/avatars/${version}.bin`
}

export function avatarVersion(userId: string, key: string) {
  const prefix = `users/${encodeURIComponent(userId)}/avatars/`
  if (!key.startsWith(prefix) || !key.endsWith('.bin')) return null
  const version = key.slice(prefix.length, -4)
  return versionPattern.test(version) ? version : null
}

export function approvedAvatarUrl(userId: string, version: string) {
  avatarKey(userId, version)
  return `/api/users/${encodeURIComponent(userId)}/avatar/${version}`
}

export function pendingAvatarUrl(userId: string, key: string) {
  const version = avatarVersion(userId, key)
  return version ? `/api/account/avatar-pending/${encodeURIComponent(userId)}/${version}` : null
}

export function approvedAvatarKey(userId: string, image: string | null) {
  const prefix = `/api/users/${encodeURIComponent(userId)}/avatar/`
  if (!image?.startsWith(prefix)) return null
  const version = image.slice(prefix.length)
  return versionPattern.test(version) ? avatarKey(userId, version) : null
}

export function isOwnedAvatarObjectKey(userId: string, key: string) {
  if (avatarVersion(userId, key)) return true
  const prefix = `users/${encodeURIComponent(userId)}/`
  if (!key.startsWith(prefix)) return false
  const suffix = key.slice(prefix.length)
  return (
    !suffix.split('/').some((part) => !part || part === '.' || part === '..') &&
    (suffix === 'avatar' || suffix === 'avatar-pending' || /^avatar(?:\/|[-.])[a-zA-Z0-9/_.-]+$/.test(suffix))
  )
}

export function approvedAvatarObjectKey(userId: string, image: string | null) {
  const key = approvedAvatarKey(userId, image)
  if (key) return key
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!image || !publicUrl) return null
  try {
    const url = new URL(image)
    const storage = new URL(publicUrl)
    const base = `${storage.pathname.replace(/\/$/, '')}/`
    if (url.origin !== storage.origin || !url.pathname.startsWith(base) || url.username || url.password) return null
    const legacyKey = url.pathname.slice(base.length).split('/').map(decodeURIComponent).join('/')
    return isOwnedAvatarObjectKey(userId, legacyKey) ? legacyKey : null
  } catch {
    return null
  }
}

export function getApprovedAvatarUrl(userId: string, image: string | null) {
  if (approvedAvatarKey(userId, image)) return image
  // Preserve already public legacy images, without accepting arbitrary origins.
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!image || !publicUrl) return null
  try {
    const url = new URL(image)
    const storage = new URL(publicUrl)
    const base = `${storage.pathname.replace(/\/$/, '')}/`
    return url.protocol === 'https:' && url.origin === storage.origin && url.pathname.startsWith(base) && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}
