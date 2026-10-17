import z from 'zod'
import type { ActionMessageResult } from '@/lib/action-result'
import { contactUsSchema } from './schema'

export type ContactUsSchemaTypes = z.infer<typeof contactUsSchema>

export type ContactUsResult =
  | (Extract<ActionMessageResult, { success: true }> & { code: 'submitted' })
  | (Extract<ActionMessageResult, { success: false }> & { code: 'rateLimited' | 'invalidData' | 'failed' })
