'use server'

import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { checkContactUsRateLimit, getRateLimitIp } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import type { ContactUsResult } from './types'
import { submitContactUs } from './workflow'

export async function createContactUs(payload: unknown): Promise<ContactUsResult> {
  return submitContactUs(payload, {
    db: prisma,
    limit: async () => checkContactUsRateLimit(getRateLimitIp(await headers())),
    reportUnexpectedError: (error) => captureServerException(error, { feature: 'contact-support', operation: 'submit' })
  })
}
