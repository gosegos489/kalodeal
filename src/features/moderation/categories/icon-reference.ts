const keyPattern = /^category-icons\/(c[a-z0-9]+)\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|webp|jpg)$/

export function categoryIconUrl(key: string, publicUrl: string) {
  return `${publicUrl.replace(/\/$/, '')}/${key}`
}

// Never interpret arbitrary external URLs, listing photos, or shared static
// assets as objects owned by this category's icon workflow.
export function getManagedCategoryIconKey(value: string | null, publicUrl: string, categoryId: string) {
  if (!value) return null
  const prefix = `${publicUrl.replace(/\/$/, '')}/`
  if (!value.startsWith(prefix)) return null
  const key = value.slice(prefix.length)
  const match = keyPattern.exec(key)
  return match?.[1] === categoryId ? key : null
}
