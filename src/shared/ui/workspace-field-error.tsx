'use client'

import { useTranslations } from 'next-intl'
import type { ComponentProps } from 'react'
import { FieldError } from '@/components/ui/field'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'

export function WorkspaceFieldError({ errors, ...props }: ComponentProps<typeof FieldError>) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)
  return (
    <FieldError
      {...props}
      errors={errors?.map((error) => error && { ...error, message: error.message ? copy(error.message, true) : t('checkField') })}
    />
  )
}
