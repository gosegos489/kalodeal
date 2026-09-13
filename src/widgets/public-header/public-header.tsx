import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingSearch } from '@/features/listing-search/ui/ListingSearch'
import ActionButtons from './ui/action-buttons'
import ActionButtonsWithSession from './ui/action-buttons-with-session'
import HeaderNavigation from './ui/header-navigation'

export function PublicHeader() {
  return (
    <header className="border-border bg-card border-b">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href="/">
            <Image src="/logo.svg" alt="Kalodeal" width={118} height={34} priority />
          </Link>
          <HeaderNavigation />
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="hidden h-10 w-55 xl:block" />}>
            <ListingSearch className="hidden w-55 xl:block" placeholder="Search Kalodeal" />
          </Suspense>
          <Suspense fallback={<ActionButtons isAuth={false} />}>
            <ActionButtonsWithSession />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
