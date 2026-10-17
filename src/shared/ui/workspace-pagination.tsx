'use client'

import { useMessages, useTranslations } from 'next-intl'
import type { ComponentProps } from 'react'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import NuqsPagination from './NuqsPagination'

export default function WorkspacePagination(props: ComponentProps<typeof NuqsPagination>) {
  const { Search: s } = useMessages()
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)
  return (
    <NuqsPagination
      {...props}
      ariaLabel={props.ariaLabel ? copy(props.ariaLabel) : t('pagination')}
      labels={{
        previous: s.previous,
        next: s.next,
        loading: s.loadingResults,
        pageOf: s.pageOf,
        goToPage: s.goToPage,
        error: s.pageError,
        retry: s.retry
      }}
    />
  )
}
