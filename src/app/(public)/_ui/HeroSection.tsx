import type { ReactNode } from 'react'

export default function HeroSection({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="hero-heading" className="max-w-5xl">
      <h1 id="hero-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        Find your next <span className="text-primary">local deal.</span>
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
        Discover everyday essentials, great finds and services from your local community.
      </p>
      <div className="mt-6 sm:mt-8">{children}</div>
    </section>
  )
}
