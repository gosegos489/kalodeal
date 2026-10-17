import type { Formats } from 'next-intl'

export const DISPLAY_TIME_ZONE = 'Asia/Nicosia'

// Shared by request formatters, client providers and pure presentation helpers.
// Billing and staff deadlines intentionally retain their explicitly labelled UTC contract.
export const formats = {
  dateTime: {
    listingDate: { day: 'numeric', month: 'short', year: 'numeric' },
    monthYear: { month: 'long', year: 'numeric' },
    utcDate: { dateStyle: 'medium', timeZone: 'UTC' },
    utcDateTime: { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
    messageTimestamp: { dateStyle: 'short', timeStyle: 'short' },
    messageClock: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
    messageDay: { month: 'long', day: 'numeric', year: 'numeric' },
    conversationDay: { day: 'numeric', month: 'short' }
  },
  number: {
    currency: { style: 'currency', currencyDisplay: 'code' },
    listingPrice: { style: 'currency', currencyDisplay: 'code', minimumFractionDigits: 0, maximumFractionDigits: 2 }
  }
} satisfies Formats
