// Email-shaped legacy names must never become a public account identifier.
export function getSellerName(displayName: string | null | undefined) {
  const name = displayName?.trim()
  return name && !name.includes('@') ? name : 'Seller'
}

export function getSellerInitials(displayName: string | null | undefined) {
  return getSellerName(displayName)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}
