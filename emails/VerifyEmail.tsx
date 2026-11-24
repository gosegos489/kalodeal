import { AuthEmail, type AuthEmailProps } from './_components/auth-email'

export default function VerifyEmail(props: AuthEmailProps) {
  return <AuthEmail {...props} kind="verification" />
}

VerifyEmail.PreviewProps = {
  locale: 'en',
  verificationUrl: 'http://localhost:3000/api/auth/verify-email?token=preview&callbackURL=%2F',
  siteUrl: 'http://localhost:3000'
} satisfies AuthEmailProps
