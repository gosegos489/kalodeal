import type { WorkspaceTranslator } from '@/i18n/workspace-copy'

const timeZone = 'Europe/Chisinau'
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })

export function formatUnreadBadge(count: number) {
  return count > 0 ? `${Math.min(Math.floor(count), 9)}+` : null
}

export function formatMessageTime(value: string, locale = 'en-GB') {
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function formatMessageClock(value: string, locale = 'en-GB') {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
}

export function messageDay(value: string) {
  return dayFormatter.format(new Date(value))
}

export function formatMessageDay(value: string, reference: string, locale = 'en-US', labels = { today: 'Today', yesterday: 'Yesterday' }) {
  if (messageDay(value) === messageDay(reference)) return labels.today
  // Compare calendar days in the display timezone, including DST transitions.
  const referenceDay = new Date(`${messageDay(reference)}T12:00:00Z`)
  referenceDay.setUTCDate(referenceDay.getUTCDate() - 1)
  if (messageDay(value) === dayFormatter.format(referenceDay)) return labels.yesterday
  return new Intl.DateTimeFormat(locale, { timeZone, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function formatConversationTime(value: string, reference: string, locale = 'en-GB') {
  return messageDay(value) === messageDay(reference)
    ? formatMessageClock(value, locale)
    : new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short' }).format(new Date(value))
}

export function formatLastSeen(value: string, reference: string, locale = 'en-GB', t?: WorkspaceTranslator) {
  const elapsed = Math.max(0, new Date(reference).getTime() - new Date(value).getTime())
  if (elapsed < 60000) return t ? t('lastSeenNow') : 'Last seen just now'
  if (elapsed < 3600000) {
    const minutes = Math.floor(elapsed / 60000)
    return t ? t('lastSeenMinutes', { count: minutes }) : `Last seen ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }
  const day = formatMessageDay(value, reference)
  if (t) {
    if (day === 'Today') return t('lastSeenToday', { time: formatMessageClock(value, locale) })
    if (day === 'Yesterday') return t('lastSeenYesterday')
    return t('lastSeenDate', { date: formatMessageDay(value, reference, locale) })
  }
  return day === 'Today' ? `Last seen today at ${formatMessageClock(value)}` : day === 'Yesterday' ? 'Last seen yesterday' : `Last seen ${day}`
}
