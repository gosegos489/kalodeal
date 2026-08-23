import { Resend } from 'resend'

const RESEND_URL = process.env.RESEND_URL

if (!RESEND_URL) {
  throw new Error('RESEND is not defined')
}

export const resend = new Resend(RESEND_URL)
