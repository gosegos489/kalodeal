const timeZone = 'Europe/Chisinau'
const clockFormatter = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })

export function formatUnreadBadge(count: number) {
  return count > 0 ? `${Math.min(Math.floor(count), 9)}+` : null
}

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function formatMessageClock(value: string) {
  return clockFormatter.format(new Date(value))
}

export function messageDay(value: string) {
  return dayFormatter.format(new Date(value))
}

export function formatMessageDay(value: string, reference: string) {
  if (messageDay(value) === messageDay(reference)) return 'Today'
  // Compare calendar days in the display timezone, including DST transitions.
  const referenceDay = new Date(`${messageDay(reference)}T12:00:00Z`)
  referenceDay.setUTCDate(referenceDay.getUTCDate() - 1)
  if (messageDay(value) === dayFormatter.format(referenceDay)) return 'Yesterday'
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function formatConversationTime(value: string, reference: string) {
  return messageDay(value) === messageDay(reference)
    ? formatMessageClock(value)
    : new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short' }).format(new Date(value))
}

export function formatLastSeen(value: string, reference: string) {
  const elapsed = Math.max(0, new Date(reference).getTime() - new Date(value).getTime())
  if (elapsed < 60000) return 'Last seen just now'
  if (elapsed < 3600000) {
    const minutes = Math.floor(elapsed / 60000)
    return `Last seen ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }
  const day = formatMessageDay(value, reference)
  return day === 'Today' ? `Last seen today at ${formatMessageClock(value)}` : day === 'Yesterday' ? 'Last seen yesterday' : `Last seen ${day}`
}
