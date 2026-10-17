// Email-shaped legacy names must never become a public account identifier.
export function getSellerName(displayName: string | null | undefined, fallback = 'Seller') {
  const name = displayName?.trim()
  return name && !name.includes('@') ? name : fallback
}

export function getSellerInitials(displayName: string | null | undefined) {
  return getSellerName(displayName)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export function postingSince(createdAt: Date) {
  return `Posting since ${new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(createdAt)}`
}
