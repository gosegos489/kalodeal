'use client'

import type { MouseEvent } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

type CustomPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  getPageHref?: (page: number) => string
  disabled?: boolean
  ariaLabel?: string
}

export function CustomPagination({ page, totalPages, onPageChange, getPageHref, disabled = false, ariaLabel = 'Pagination' }: CustomPaginationProps) {
  if (totalPages <= 1) return null

  // At most five page numbers, independent of the number of listings.
  const pages = Array.from(
    new Set(totalPages <= 5 ? Array.from({ length: totalPages }, (_, index) => index + 1) : [1, page - 1, page, page + 1, totalPages])
  )
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b)

  function navigate(event: MouseEvent<HTMLAnchorElement>, nextPage: number) {
    if (disabled || nextPage < 1 || nextPage > totalPages || nextPage === page) {
      event.preventDefault()
      return
    }
    if (getPageHref && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return
    event.preventDefault()
    onPageChange(nextPage)
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-3" aria-busy={disabled}>
      <Pagination aria-label={ariaLabel}>
        <PaginationContent className="flex-wrap justify-center gap-1">
          <PaginationItem>
            <PaginationPrevious
              href={getPageHref?.(Math.max(1, page - 1)) ?? '#'}
              aria-disabled={disabled || page === 1}
              tabIndex={disabled || page === 1 ? -1 : undefined}
              className={cn((disabled || page === 1) && 'pointer-events-none opacity-50')}
              onClick={(event) => navigate(event, page - 1)}
            />
          </PaginationItem>
          {pages.map((pageNumber, index) => (
            <PaginationItem key={pageNumber} className="flex items-center gap-1">
              {index > 0 && pageNumber - pages[index - 1] > 1 && <PaginationEllipsis className="hidden sm:flex" />}
              <PaginationLink
                href={getPageHref?.(pageNumber) ?? '#'}
                isActive={pageNumber === page}
                aria-label={`Go to page ${pageNumber}`}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                className={cn(
                  totalPages > 5 && Math.abs(pageNumber - page) > 1 && 'hidden sm:inline-flex',
                  disabled && 'pointer-events-none opacity-50'
                )}
                onClick={(event) => navigate(event, pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href={getPageHref?.(Math.min(totalPages, page + 1)) ?? '#'}
              aria-disabled={disabled || page === totalPages}
              tabIndex={disabled || page === totalPages ? -1 : undefined}
              className={cn((disabled || page === totalPages) && 'pointer-events-none opacity-50')}
              onClick={(event) => navigate(event, page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-muted-foreground text-xs" role="status">
        {disabled ? 'Loading listings...' : `Page ${page} of ${totalPages}`}
      </p>
    </div>
  )
}
