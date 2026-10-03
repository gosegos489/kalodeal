export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Chisinau', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
