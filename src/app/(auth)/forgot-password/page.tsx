import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth'

const benefits = [
  'Receive a secure password reset link by email',
  'Choose a new password in just a few steps',
  'Get back to your KaloDeal account quickly'
]

export default function ForgotPasswordPage() {
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Password recovery</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Reset your password</h1>

            <h2 className="text-muted-foreground text-lg leading-8">
              Enter the email address linked to your KaloDeal account and we&apos;ll send you a secure password reset link.
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5 shrink-0" />

                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-semibold">Forgot your password?</p>

            <p className="text-muted-foreground text-sm">Enter your email address and we&apos;ll send you a link to create a new password.</p>
          </div>

          <ForgotPasswordForm />

          <p className="text-muted-foreground text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
