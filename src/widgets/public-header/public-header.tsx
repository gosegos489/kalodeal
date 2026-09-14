import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingSearch } from '@/features/listing-search/ui/ListingSearch'
import ActionButtons from './ui/action-buttons'
import ActionButtonsWithSession from './ui/action-buttons-with-session'
import HeaderNavigation from './ui/header-navigation'
import MobileMenu from './ui/mobile-menu'
import MobileMenuWithSession from './ui/mobile-menu-with-session'

export function PublicHeader() {
  return (
    <header className="border-border bg-card border-b">
      <div className="container flex items-center justify-between gap-3 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-4 lg:gap-10">
          <Link href="/">
            <Image src="/logo.svg" alt="Kalodeal" width={590} height={169} className="h-auto w-29.5" priority />
          </Link>

          <HeaderNavigation />
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Suspense fallback={<Skeleton className="hidden h-10 w-55 xl:block" />}>
            <ListingSearch className="hidden w-55 xl:block" placeholder="Search Kalodeal" />
          </Suspense>
          <Suspense fallback={<ActionButtons isAuth={false} />}>
            <ActionButtonsWithSession />
          </Suspense>
          <Suspense fallback={<MobileMenu isAuth={false} currentYear={2026} />}>
            <MobileMenuWithSession />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
