import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import RegisterForm from './RegisterForm'

const benefits = ['Post listings in a few minutes', 'Manage your listings from one place', 'Save and compare interesting offers']

export default function RegisterPage() {
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Join KaloDeal</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Create your account</h1>

            <h2 className="text-muted-foreground text-lg leading-8">Buy, sell and discover local deals all in one place.</h2>
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
            <p className="text-2xl font-semibold">Sign up</p>

            <p className="text-muted-foreground text-sm">Enter your details to create a KaloDeal account.</p>
          </div>

          <RegisterForm />

          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
