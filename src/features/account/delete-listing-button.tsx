'use client'

import { Loader2, Trash2 } from 'lucide-react'
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
import { deleteListing } from './actions'

export function DeleteListingButton({ listingId, title }: { listingId: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteListing(listingId)
        if (!result.success) {
          setError(result.message)
          toast.add({ title: 'Could not delete listing', description: result.message, type: 'error' })
          return
        }
        setOpen(false)
        toast.add({ title: 'Listing deleted', description: result.message, type: 'success' })
      } catch {
        const message = 'Could not delete your listing. Check your connection and try again.'
        setError(message)
        toast.add({ title: 'Could not delete listing', description: message, type: 'error' })
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
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />} aria-label={`Delete listing: ${title}`}>
        <Trash2 aria-hidden="true" /> Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100vw-2rem)]" aria-busy={isPending}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete listing?</AlertDialogTitle>
          <AlertDialogDescription className="wrap-anywhere">
            &ldquo;{title}&rdquo; will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <Trash2 aria-hidden="true" />}
            {isPending ? 'Deleting...' : 'Delete listing'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
