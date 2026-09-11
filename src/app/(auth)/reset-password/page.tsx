import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ResetPasswordForm, ResetPasswordSkeleton } from '@/features/auth/reset-password'

const benefits = ['Create a new secure password for your account', 'Restore access to your KaloDeal account', 'Sign in again with your new password']

type Props = {
  searchParams: Promise<{ token: string }>
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Password reset</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Create a new password</h1>

            <h2 className="text-muted-foreground text-lg leading-8">
              Choose a new secure password for your KaloDeal account to restore access and continue where you left off.
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
            <p className="text-2xl font-semibold">Set a new password</p>

            <p className="text-muted-foreground text-sm">Enter and confirm your new password below to secure your account.</p>
          </div>

          <Suspense fallback={<ResetPasswordSkeleton />}>
            <ResetPasswordFormWrapper searchParams={searchParams} />
          </Suspense>

          <p className="text-muted-foreground text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

async function ResetPasswordFormWrapper({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium">Invalid or missing reset link</p>
        <p className="text-muted-foreground text-sm">This password reset link is invalid. Please request a new one.</p>
        <Link className="text-primary text-xl font-bold" href="/forgot-password">
          Request new link
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
