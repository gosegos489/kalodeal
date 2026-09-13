import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'

export default function NotFound() {
  return (
    <>
      <PublicHeader />

      <main className="container flex flex-1 items-center py-10">
        <section className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-primary text-sm font-semibold tracking-wide uppercase">404</p>

              <p className="text-4xl font-bold text-balance md:text-5xl">This page is not available anymore</p>

              <p className="text-muted-foreground max-w-xl text-base leading-7">
                The listing may have been removed, sold, or moved to another address. You can go back home and continue browsing fresh deals.
              </p>
            </div>

            <Link className="bg-primary hover:bg-primary/90 flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-white transition-colors" href="/">
              <Home />
              Back to home
            </Link>
          </div>

          <div className="bg-muted/30 flex flex-col gap-8 rounded-lg border p-6">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="size-4" />
              Lost page
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-background h-3 w-3/4 rounded-full" />
              <div className="bg-background h-3 w-full rounded-full" />
              <div className="bg-background h-3 w-2/3 rounded-full" />
            </div>

            <div className="bg-background flex flex-col gap-1 rounded-lg border p-4">
              <p className="text-sm font-medium">Try searching again</p>

              <p className="text-muted-foreground text-sm">Cars, jobs, services, and local items are still waiting on the homepage.</p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  )
}
