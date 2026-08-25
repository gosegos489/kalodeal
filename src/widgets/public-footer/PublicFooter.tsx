import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import Copyrights from './ui/Copyrights'

export const PublicFooter = () => {
  return (
    <footer>
      <Suspense fallback={<Skeleton className="h-9 w-100" />}>
        <Copyrights />
      </Suspense>
    </footer>
  )
}
