export function formatPaymentAmount(amountCents: number, currency: string) {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) throw new Error('Invalid payment amount.')

  return new Intl.NumberFormat('en', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100)
}
