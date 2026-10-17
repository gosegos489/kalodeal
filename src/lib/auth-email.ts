import { render, toPlainText } from 'react-email'
import 'server-only'
import { createElement } from 'react'
import { localizeAuthEmailUrl } from '@/features/auth/email-links'
import { getAuthEmailLocale } from '@/features/auth/email-locale'
import ResetPasswordEmail from '../../emails/ResetPasswordEmail'
import VerifyEmail from '../../emails/VerifyEmail'
import { type AuthEmailKind, getAuthEmailMessages } from '../../emails/_lib/messages'
import { resend, resendFrom } from './resend'

export async function sendAuthEmail({ kind, email, url }: { kind: AuthEmailKind; email: string; url: string }, request?: Request) {
  const locale = getAuthEmailLocale(url, request)
  const verificationUrl = localizeAuthEmailUrl(url, locale, kind)
  const projectName = process.env.PROJECT_NAME ?? 'Kalodeal'
  const template = kind === 'verification' ? VerifyEmail : ResetPasswordEmail
  const html = await render(createElement(template, { locale, verificationUrl }))
  await resend.emails.send({
    from: resendFrom,
    to: email,
    subject: getAuthEmailMessages(locale, projectName)[kind].subject,
    html,
    text: toPlainText(html)
  })
}
