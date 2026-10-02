export type AnalyticsPeriod = 'all' | '7' | '30'

export function getAnalyticsPeriod(input: unknown): AnalyticsPeriod {
  return input === '7' || input === '30' ? input : 'all'
}

export function getAnalyticsDateRange(period: AnalyticsPeriod, now = new Date()) {
  if (period === 'all') return undefined
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - Number(period))
  return { gte: start, lt: end }
}
