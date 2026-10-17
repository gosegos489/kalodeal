import ResetPasswordEmail from '../ResetPasswordEmail'

export default function ResetPasswordEmailEL() {
  return (
    <ResetPasswordEmail
      {...ResetPasswordEmail.PreviewProps}
      locale="el"
      verificationUrl="http://localhost:3000/api/auth/reset-password/preview?callbackURL=%2Fel%2Freset-password"
    />
  )
}
