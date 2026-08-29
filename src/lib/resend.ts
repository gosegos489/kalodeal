import { Resend } from 'resend'
import 'server-only'

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined')
}

export const resendFrom = process.env.RESEND_FROM_EMAIL!

export const resend = new Resend(resendApiKey)
