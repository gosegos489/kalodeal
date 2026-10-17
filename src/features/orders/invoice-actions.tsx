'use client'

import { Download, ExternalLink, LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { getPaymentInvoiceUrl } from './actions'

export function InvoiceActions({ paymentId, label }: { paymentId: string; label: string }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'view' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openInvoice(action: 'view' | 'pdf') {
    setPendingAction(action)
    setError(null)
    startTransition(async () => {
      try {
        const result = await getPaymentInvoiceUrl({ paymentId, action })
        if (result.success) {
          window.location.assign(result.data.url)
          return
        }
        setError(copy(result.message, true))
        toast.add({ title: t('invoiceUnavailable'), description: copy(result.message, true), type: 'error' })
      } catch {
        const message = t('couldNotOpenYourInvoicePleaseTryAgain')
        setError(message)
        toast.add({ title: t('invoiceUnavailable'), description: message, type: 'error' })
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {(['view', 'pdf'] as const).map((action) => {
          const pending = isPending && pendingAction === action
          const title = action === 'view' ? t('viewInvoice') : t('downloadPDF')
          const Icon = action === 'view' ? ExternalLink : Download
          return (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => openInvoice(action)}
              disabled={isPending}
              aria-busy={pending}
              aria-label={t('valueForValue', { value0: title, value1: label })}
            >
              {pending ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <Icon aria-hidden="true" />}
              {pending ? t('openingPending') : title}
            </Button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
