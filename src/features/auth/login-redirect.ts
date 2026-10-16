import { PAID_PLANS } from '@/lib/plan-limits'

// Only the known pricing continuation is allowed; arbitrary return URLs are never followed.
export function getLoginRedirect(returnTo?: string | null) {
  if (returnTo === '/pricing') return returnTo
  for (const plan of PAID_PLANS) {
    if (returnTo === `/pricing?plan=${plan}`) return returnTo
  }
  return '/account'
}
