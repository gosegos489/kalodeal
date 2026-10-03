'use client'

import { Loader2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { openListingConversation } from './actions'

export function MessageSellerButton({ listingId, isAuthenticated }: { listingId: string; isAuthenticated: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  if (!isAuthenticated) {
    return (
      <Button nativeButton={false} size="lg" className="w-full" render={<Link href="/login" />}>
        <MessageCircle aria-hidden="true" /> Message seller
      </Button>
    )
  }
  function open() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await openListingConversation({ listingId })
        if (!result.success) {
          setError(result.message)
          toast.add({ title: 'Could not open conversation', description: result.message, type: 'error' })
          return
        }
        router.push(`/account/messages/${result.data.conversationId}`)
      } catch {
        setError('Could not open this conversation. Please try again.')
      }
    })
  }
  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" disabled={pending} onClick={open} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <MessageCircle aria-hidden="true" />}
        {pending ? 'Opening...' : 'Message seller'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
