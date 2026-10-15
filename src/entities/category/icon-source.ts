// Only image URLs/paths enter next/image. Lucide names are resolved on the server.
export function getCategoryIconImage(value: string | null | undefined) {
  const source = value?.trim()
  if (!source || /[\u0000-\u001f\\]/.test(source)) return null
  if (source.startsWith('/') && !source.startsWith('//')) return source
  if (/^(?:icons|images)\//.test(source)) return `/${source}`
  try {
    const url = new URL(source)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
