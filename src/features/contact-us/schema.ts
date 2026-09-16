import z from 'zod'

export const CONTACT_US_QUESTIONS = ['GENERAL', 'TECHNICAL', 'BILLING', 'OTHER'] as const

export const contactUsSchema = z.object({
  contactEmail: z.email('Enter a valid email').max(64, 'Email must be less than 64 characters'),
  question: z.enum(CONTACT_US_QUESTIONS),
  message: z.string().min(10, 'Message must be at least 10 characters').max(600, 'Message must be less than 600 characters')
})
