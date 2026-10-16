'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { paginationPageParser, serializePagination } from '@/lib/pagination'
import { CustomPagination, type PaginationLabels } from './CustomPagination'

type NuqsPaginationProps = {
  labels?: PaginationLabels
  totalPages: number
  ariaLabel?: string
  pageKey?: string
}

export default function NuqsPagination({ totalPages, ariaLabel, pageKey = 'page', labels }: NuqsPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useQueryState(
    pageKey,
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
      toast.add({ title: labels?.error ?? 'Could not change page', description: labels?.retry ?? 'Please try again.', type: 'error' })
    }
  }

  return (
    <CustomPagination
      labels={labels}
      page={Math.min(page, Math.max(1, totalPages))}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      getPageHref={(nextPage) => {
        if (pageKey === 'page') return `${pathname}${serializePagination(searchParams, { page: nextPage })}`
        const query = new URLSearchParams(searchParams)
        query.set(pageKey, String(nextPage))
        return `${pathname}?${query}`
      }}
      disabled={isPending}
      ariaLabel={ariaLabel}
    />
  )
}
