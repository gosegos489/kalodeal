export function isSafeLegalLink(value: string) {
  if (!value || value.length > 2048 || /[\s\u0000-\u001f\u007f\\]/.test(value)) return false
  if (/^(\/(?!\/)|\.\.?\/|#|\?)/.test(value)) return true
  // Preserve the contact links in the existing seeded documents, without mail headers.
  if (/^mailto:[^@?<>:]+@[^@?<>:]+$/i.test(value)) return true
  if (/^tel:\+?\d{3,15}$/i.test(value)) return true
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password
  } catch {
    return false
  }
}
