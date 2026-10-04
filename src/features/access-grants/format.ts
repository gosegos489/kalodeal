export function formatGrantDate(value: Date | string | null) {
  if (!value) return 'Never'
  return `${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))} UTC`
}
