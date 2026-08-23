'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { CustomPagination } from './CustomPagination'

type NuqsPaginationProps = {
  totalPages: number
}

export default function NuqsPagination({ totalPages }: NuqsPaginationProps) {
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({
      shallow: false
    })
  )

  const handlePageChange = (page: number) => {
    setPage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return <CustomPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
}
