import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/shared/ui/SearchInput'
import ActionButtons from './ui/action-buttons'
import HeaderNavigation from './ui/header-navigation'

export function PublicHeader() {
  return (
    <header className="border-border bg-card border-b">
      <div className="container flex h-18 items-center justify-between gap-5 px-4 sm:px-6 lg:px-16">
        <div className="flex min-w-0 items-center gap-8 lg:gap-10">
          <Link className="shrink-0" href="/">
            <Image src="/logo.svg" alt="Kalodeal" width={118} height={34} priority />
          </Link>
          <HeaderNavigation />
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="hidden h-10 w-55 xl:block" />}>
            <SearchInput className="hidden w-55 xl:block" placeholder="Search Kalodeal" />
          </Suspense>
          <ActionButtons />
        </div>
      </div>
    </header>
  )
}
