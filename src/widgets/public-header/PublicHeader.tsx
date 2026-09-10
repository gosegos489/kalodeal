import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/shared/ui/SearchInput'
import ActionButtons from './ui/ActionButtons'
import HeaderNavigation from './ui/HeaderNavigation'

export async function PublicHeader() {
  return (
    <header>
      <div className="container flex items-center justify-between gap-10 py-6">
        <div className="flex items-center gap-10">
          <Link className="shrink-0" href="/">
            <Image src="/logo.svg" alt="KaloDeal Logo" width={160} height={46} priority />
          </Link>

          <Suspense fallback={<Skeleton className="h-9 w-110 max-w-full" />}>
            <SearchInput className="w-110 max-w-full" placeholder="Search items, cars, jobs..." />
          </Suspense>
        </div>
        <HeaderNavigation />
        <ActionButtons />
      </div>
    </header>
  )
}
