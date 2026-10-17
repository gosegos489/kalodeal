import z from 'zod'

export const CONTACT_US_QUESTIONS = ['GENERAL', 'TECHNICAL', 'BILLING', 'OTHER'] as const

const defaultValidationMessages = {
  emailInvalid: 'Enter a valid email',
  emailTooLong: 'Email must be less than 64 characters',
  topicInvalid: 'Select a valid topic',
  messageTooShort: 'Message must be at least 10 characters',
  messageTooLong: 'Message must be less than 600 characters'
}

export function createContactUsSchema(messages = defaultValidationMessages) {
  return z.object({
    contactEmail: z.email(messages.emailInvalid).max(64, messages.emailTooLong),
    question: z.enum(CONTACT_US_QUESTIONS, { error: messages.topicInvalid }),
    message: z.string().min(10, messages.messageTooShort).max(600, messages.messageTooLong)
  })
}

export const contactUsSchema = createContactUsSchema()
