import { getDisplayFormatter } from '@/i18n/formatter'

export function formatPaymentAmount(amountCents: number, currency: string, locale: string) {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) throw new Error('Invalid payment amount.')

  // Persisted subscription receipts use cents. Convert only at the display boundary.
  return getDisplayFormatter(locale).number(amountCents / 100, 'currency', { currency: currency.toUpperCase() })
}
