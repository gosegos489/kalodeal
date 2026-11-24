import { AuthEmail, type AuthEmailProps } from './_components/auth-email'

export default function ResetPasswordEmail(props: AuthEmailProps) {
  return <AuthEmail {...props} kind="reset" />
}

ResetPasswordEmail.PreviewProps = {
  locale: 'en',
  verificationUrl: 'http://localhost:3000/api/auth/reset-password/preview?callbackURL=%2Freset-password',
  siteUrl: 'http://localhost:3000'
} satisfies AuthEmailProps
