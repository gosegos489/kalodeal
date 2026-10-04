'use server'

import { headers } from 'next/headers'
import type { ActionMessageResult } from '@/lib/action-result'
import prisma from '@/lib/prisma'
import { checkContactUsRateLimit, getRateLimitIp } from '@/lib/rate-limit'
import { captureServerException } from '@/lib/sentry-server'
import { submitContactUs } from './workflow'

export async function createContactUs(payload: unknown): Promise<ActionMessageResult> {
  return submitContactUs(payload, {
    db: prisma,
    limit: async () => checkContactUsRateLimit(getRateLimitIp(await headers())),
    reportUnexpectedError: (error) => captureServerException(error, { feature: 'contact-support', operation: 'submit' })
  })
}
