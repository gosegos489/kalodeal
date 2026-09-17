'use server'

import { headers } from 'next/headers'
import type { ActionMessageResult } from '@/lib/action-result'
import { contactUsSchema } from './schema'
import prisma from '@/lib/prisma'
import { checkContactUsRateLimit, getRateLimitIp } from '@/lib/rate-limit'

export async function createContactUs(payload: unknown): Promise<ActionMessageResult> {
  const rateLimit = await checkContactUsRateLimit(getRateLimitIp(await headers()))
  if (!rateLimit.success) return { success: false, message: rateLimit.message }

  const data = contactUsSchema.safeParse(payload)

  if (!data.success) {
    return {
      success: false,
      message: 'Invalid data'
    }
  }

  await prisma.contactUs.create({
    data: {
      contactEmail: data.data.contactEmail,
      question: data.data.question,
      message: data.data.message
    }
  })

  return {
    success: true,
    message: 'Contact us form submitted successfully'
  }
}
