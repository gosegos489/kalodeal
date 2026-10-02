'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { paginationPageParser, serializePagination } from '@/lib/pagination'
import { CustomPagination } from './CustomPagination'

type NuqsPaginationProps = {
  totalPages: number
  ariaLabel?: string
}

export default function NuqsPagination({ totalPages, ariaLabel }: NuqsPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useQueryState(
    'page',
    paginationPageParser.withOptions({
      shallow: false,
      history: 'push',
      scroll: true,
      startTransition
    })
  )

  async function handlePageChange(nextPage: number) {
    try {
      await setPage(nextPage)
    } catch {
      toast.add({ title: 'Could not change page', description: 'Please try again.', type: 'error' })
    }
  }

  return (
    <CustomPagination
      page={Math.min(page, Math.max(1, totalPages))}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      getPageHref={(nextPage) => `${pathname}${serializePagination(searchParams, { page: nextPage })}`}
      disabled={isPending}
      ariaLabel={ariaLabel}
    />
  )
}
