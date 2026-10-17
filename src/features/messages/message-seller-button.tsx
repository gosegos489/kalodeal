'use client'

import { Loader2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { type Locale, localizeHref } from '@/i18n/routing'
import { openListingConversation } from './actions'

const defaultLabels = {
  message: 'Message seller',
  opening: 'Opening...',
  error: 'Could not open conversation',
  retry: 'Could not open this conversation. Please try again.'
}
export function MessageSellerButton({
  listingId,
  isAuthenticated,
  labels = defaultLabels,
  loginHref = '/login',
  locale = 'en'
}: {
  listingId: string
  isAuthenticated: boolean
  labels?: typeof defaultLabels
  locale?: Locale
  loginHref?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  if (!isAuthenticated) {
    return (
      <Button nativeButton={false} size="lg" className="w-full" render={<Link href={loginHref} />}>
        <MessageCircle aria-hidden="true" /> {labels.message}
      </Button>
    )
  }
  function open() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await openListingConversation({ listingId })
        if (!result.success) {
          setError(locale === 'en' ? result.message : labels.retry)
          toast.add({ title: labels.error, description: locale === 'en' ? result.message : labels.retry, type: 'error' })
          return
        }
        router.push(localizeHref(`/account/messages/${result.data.conversationId}`, locale))
      } catch {
        setError(labels.retry)
      }
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" disabled={pending} onClick={open} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <MessageCircle aria-hidden="true" />}
        {pending ? labels.opening : labels.message}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
