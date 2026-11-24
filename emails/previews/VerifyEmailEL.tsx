import VerifyEmail from '../VerifyEmail'

export default function VerifyEmailEL() {
  return (
    <VerifyEmail
      {...VerifyEmail.PreviewProps}
      locale="el"
      verificationUrl="http://localhost:3000/api/auth/verify-email?token=preview&callbackURL=%2Fel"
    />
  )
}
