'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { deleteListing } from './actions'

export function DeleteListingButton({ listingId, title }: { listingId: string; title: string }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteListing(listingId)
        if (!result.success) {
          setError(copy(result.message, true))
          toast.add({ title: t('couldNotDeleteListing'), description: copy(result.message, true), type: 'error' })
          return
        }
        setOpen(false)
        toast.add({ title: t('listingDeleted'), description: copy(result.message, true), type: 'success' })
      } catch {
        const message = t('couldNotDeleteYourListingCheckYourConnectionAndTryAgain')
        setError(message)
        toast.add({ title: t('couldNotDeleteListing'), description: message, type: 'error' })
      }
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setOpen(nextOpen)
        setError(null)
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />} aria-label={t('deleteListingValue', { value0: title })}>
        <Trash2 aria-hidden="true" /> {t('delete')}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100vw-2rem)]" aria-busy={isPending}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteListing116')}</AlertDialogTitle>
          <AlertDialogDescription className="wrap-anywhere">
            &ldquo;{title}
            {t('willBePermanentlyDeletedThisCannotBeUndone')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <Trash2 aria-hidden="true" />}
            {isPending ? t('deleting') : t('deleteListing')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
