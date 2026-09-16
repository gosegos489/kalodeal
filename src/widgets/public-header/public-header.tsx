import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingSearch } from '@/features/listing-search/ui/ListingSearch'
import ActionButtonsWithSession from './ui/action-buttons-with-session'
import { NavigationLinks } from './ui/header-navigation'
import MobileMenuWithSession from './ui/mobile-menu-with-session'

export function PublicHeader() {
  return (
    <header className="border-border bg-card border-b">
      <div className="container flex items-center justify-between gap-3 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-4 lg:gap-10">
          <Link href="/">
            <Image src="/logo.svg" alt="Kalodeal" width={590} height={169} className="h-auto w-29.5" priority />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <Suspense fallback={<Skeleton className="h-5 w-64" />}>
              <NavigationLinks />
            </Suspense>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Suspense fallback={<Skeleton className="hidden h-10 w-55 xl:block" />}>
            <ListingSearch className="hidden w-55 xl:block" placeholder="Search Kalodeal" />
          </Suspense>
          <Suspense
            fallback={
              <div className="flex items-center gap-1 sm:gap-2" role="status" aria-label="Loading account menu">
                <Skeleton className="hidden h-10 w-32 sm:block" />
                <Skeleton className="h-10 w-20 sm:w-40" />
              </div>
            }
          >
            <ActionButtonsWithSession />
          </Suspense>
          <Suspense fallback={<Skeleton className="size-10 md:hidden" />}>
            <MobileMenuWithSession />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
