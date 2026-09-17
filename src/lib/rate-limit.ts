import { Ratelimit } from '@upstash/ratelimit'
import { isIP } from 'node:net'
import 'server-only'
import { redis } from '@/lib/redis'

const createListingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'ratelimit:listing:create',
  timeout: 3000
})

const contactUsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'ratelimit:contact-us',
  timeout: 3000
})

type RateLimitResult =
  | { success: true }
  | { success: false; status: 429 | 503; message: string; retryAfter: number }

function unavailable(): RateLimitResult {
  return { success: false, status: 503, message: 'This service is temporarily unavailable. Please try again later.', retryAfter: 60 }
}

async function checkRateLimit(limiter: Ratelimit, identifier: string): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier)
    // Upstash allows requests on timeout by default; writes must stay protected.
    if (result.reason === 'timeout') return unavailable()
    if (result.success) return { success: true }

    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    return { success: false, status: 429, message: `Too many attempts. Please try again in ${retryAfter} seconds.`, retryAfter }
  } catch (error) {
    console.error('Rate limit check failed.', error instanceof Error ? error.name : 'Unknown error')
    return unavailable()
  }
}

export function getRateLimitIp(headers: Pick<Headers, 'get'>): string | null {
  // Vercel supplies this header. Self-hosted proxies must overwrite IP headers.
  const forwarded = process.env.VERCEL === '1'
    ? headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for')
    : headers.get('x-real-ip') ?? headers.get('x-forwarded-for')
  if (!forwarded) return process.env.NODE_ENV === 'development' ? '127.0.0.1' : null

  const ip = forwarded.trim()
  const version = isIP(ip)
  if (version === 4) return ip
  if (version !== 6 || ip.includes('%')) return null

  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
  const [left, right] = canonical.split('::')
  const start = left ? left.split(':') : []
  const end = right ? right.split(':') : []
  const groups = right === undefined ? start : [...start, ...Array<string>(8 - start.length - end.length).fill('0'), ...end]
  const values = groups.map((group) => parseInt(group, 16))

  // IPv4-mapped IPv6 addresses share the IPv4 counter.
  if (values.slice(0, 5).every((value) => value === 0) && values[5] === 0xffff) {
    return [values[6] >> 8, values[6] & 255, values[7] >> 8, values[7] & 255].join('.')
  }
  // Group IPv6 by /64 so rotating addresses in one subnet cannot reset the limit.
  return `${values.slice(0, 4).map((value) => value.toString(16)).join(':')}::/64`
}

export function checkCreateListingRateLimit(userId: string) {
  return checkRateLimit(createListingLimiter, `user:${userId}`)
}

export function checkContactUsRateLimit(ip: string | null) {
  if (!ip) return Promise.resolve(unavailable())
  return checkRateLimit(contactUsLimiter, `ip:${ip}`)
}
