export function formatPaymentAmount(amountCents: number, currency: string, locale = 'en') {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) throw new Error('Invalid payment amount.')

  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100)
}
