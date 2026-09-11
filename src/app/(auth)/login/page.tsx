import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { LoginForm } from '@/features/auth/login'

const benefits = ['Access your saved listings and favorites', 'Manage your active listings', 'Continue browsing deals from where you left off']

export default function LoginPage() {
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Welcome back</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Sign in to KaloDeal</h1>

            <h2 className="text-muted-foreground text-lg leading-8">
              Access your account and continue buying, selling and discovering great local deals.
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
            <p className="text-2xl font-semibold">Sign in</p>

            <p className="text-muted-foreground text-sm">Enter your email and password to access your KaloDeal account.</p>
          </div>

          <LoginForm />

          <div className="flex flex-col items-center justify-center gap-2 text-center text-sm">
            <Link href="/forgot-password" className="text-primary w-fit font-medium hover:underline">
              Forgot your password?
            </Link>

            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
