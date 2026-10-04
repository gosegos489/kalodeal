import { z } from 'zod'
import { ContactUsStatus } from '@/generated/prisma/enums'

export const contactStatusLabels: Record<ContactUsStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  CLOSED: 'Closed'
}
export const contactFilterSchema = z.enum(['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'UNREAD'])
export const contactIdSchema = z.cuid().max(64)
export const contactStatusSchema = z.object({
  id: contactIdSchema,
  status: z.enum(ContactUsStatus),
  updatedAt: z.iso.datetime({ precision: 3 })
})
export type ContactSearchParams = { page?: string | string[]; q?: string | string[]; status?: string | string[] }
