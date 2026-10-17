import { DISPLAY_TIME_ZONE } from '@/i18n/formats'
import { getDisplayFormatter } from '@/i18n/formatter'
import type { WorkspaceTranslator } from '@/i18n/workspace-copy'

// Machine-only calendar parts, never a user-visible English date.
const dayFormatter = new Intl.DateTimeFormat('en', { timeZone: DISPLAY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

export function formatUnreadBadge(count: number) {
  return count > 0 ? `${Math.min(Math.floor(count), 9)}+` : null
}

export function formatMessageTime(value: string, locale: string) {
  return getDisplayFormatter(locale).dateTime(new Date(value), 'messageTimestamp')
}

export function formatMessageClock(value: string, locale: string) {
  return getDisplayFormatter(locale).dateTime(new Date(value), 'messageClock')
}

export function messageDay(value: string) {
  const parts = dayFormatter.formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value)
  // A calendar-day index, not elapsed milliseconds: yesterday survives 23/25-hour DST days.
  return Date.UTC(part('year'), part('month') - 1, part('day')) / 86400000
}

export function formatMessageDay(value: string, reference: string, locale: string, labels: { today: string; yesterday: string }) {
  const day = messageDay(value)
  const referenceDay = messageDay(reference)
  if (day === referenceDay) return labels.today
  if (day === referenceDay - 1) return labels.yesterday
  return getDisplayFormatter(locale).dateTime(new Date(value), 'messageDay')
}

export function formatConversationTime(value: string, reference: string, locale: string) {
  return messageDay(value) === messageDay(reference)
    ? formatMessageClock(value, locale)
    : getDisplayFormatter(locale).dateTime(new Date(value), 'conversationDay')
}

export function formatLastSeen(value: string, reference: string, locale: string, t: WorkspaceTranslator) {
  const elapsed = Math.max(0, new Date(reference).getTime() - new Date(value).getTime())
  if (elapsed < 60000) return t('lastSeenNow')
  if (elapsed < 3600000) {
    const minutes = Math.floor(elapsed / 60000)
    return t('lastSeenMinutes', { count: minutes })
  }
  const day = messageDay(value)
  const referenceDay = messageDay(reference)
  if (day === referenceDay) return t('lastSeenToday', { time: formatMessageClock(value, locale) })
  if (day === referenceDay - 1) return t('lastSeenYesterday')
  return t('lastSeenDate', { date: getDisplayFormatter(locale).dateTime(new Date(value), 'messageDay') })
}
