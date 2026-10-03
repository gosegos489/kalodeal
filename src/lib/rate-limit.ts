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

const updateListingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: 'ratelimit:listing:update',
  timeout: 3000
})

const bumpListingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:listing:bump',
  timeout: 3000
})

const listingPhotoLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 m'),
  prefix: 'ratelimit:listing:photos',
  timeout: 3000
})

const contactUsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'ratelimit:contact-us',
  timeout: 3000
})

const avatarUploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'ratelimit:avatar:upload',
  timeout: 3000
})

const passwordChangeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:account:password',
  timeout: 3000
})

const listingSearchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:listing:search',
  timeout: 3000
})

const listingPhoneRevealLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'ratelimit:listing:phone-reveal',
  timeout: 3000
})

const listingViewLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:listing:view',
  timeout: 3000
})

const messageSendLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'ratelimit:messages:send',
  timeout: 3000
})

const conversationCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:messages:create',
  timeout: 3000
})

const chatReportLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'ratelimit:messages:report',
  timeout: 3000
})

type RateLimitResult = { success: true } | { success: false; status: 429 | 503; message: string; retryAfter: number }

function unavailable(): RateLimitResult {
  return { success: false, status: 503, message: 'This service is temporarily unavailable. Please try again later.', retryAfter: 60 }
}

async function checkRateLimit(limiter: Ratelimit, identifier: string): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier)
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
  const forwarded = headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for') ?? headers.get('x-real-ip')
  if (!forwarded) return process.env.NODE_ENV === 'development' ? '127.0.0.1' : null

  const ip = forwarded.split(',')[0].trim()
  return isIP(ip) ? ip : null
}

export function checkCreateListingRateLimit(userId: string) {
  return checkRateLimit(createListingLimiter, `user:${userId}`)
}

export function checkUpdateListingRateLimit(userId: string) {
  return checkRateLimit(updateListingLimiter, `user:${userId}`)
}

export function checkBumpListingRateLimit(userId: string) {
  return checkRateLimit(bumpListingLimiter, `user:${userId}`)
}

export function checkListingPhotoRateLimit(userId: string) {
  return checkRateLimit(listingPhotoLimiter, `user:${userId}`)
}

export function checkAvatarUploadRateLimit(userId: string) {
  return checkRateLimit(avatarUploadLimiter, `user:${userId}`)
}

export function checkPasswordChangeRateLimit(userId: string) {
  return checkRateLimit(passwordChangeLimiter, `user:${userId}`)
}

export function checkContactUsRateLimit(ip: string | null) {
  if (!ip) return Promise.resolve(unavailable())
  return checkRateLimit(contactUsLimiter, `ip:${ip}`)
}

export function checkListingSearchRateLimit(ip: string | null) {
  if (!ip) return Promise.resolve(unavailable())
  return checkRateLimit(listingSearchLimiter, `ip:${ip}`)
}

export function checkListingPhoneRevealRateLimit(userId: string) {
  return checkRateLimit(listingPhoneRevealLimiter, `user:${userId}`)
}

export function checkListingViewRateLimit(ip: string | null) {
  if (!ip) return Promise.resolve(unavailable())
  return checkRateLimit(listingViewLimiter, `ip:${ip}`)
}

export function checkMessageSendRateLimit(userId: string) {
  return checkRateLimit(messageSendLimiter, `user:${userId}`)
}

export function checkConversationCreateRateLimit(userId: string) {
  return checkRateLimit(conversationCreateLimiter, `user:${userId}`)
}

export function checkChatReportRateLimit(userId: string) {
  return checkRateLimit(chatReportLimiter, `user:${userId}`)
}
