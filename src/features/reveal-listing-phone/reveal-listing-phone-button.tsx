'use client'

import { Loader2, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { revealListingPhone } from './actions'

type PhoneLabels = { reveal: string; revealing: string; revealLabel: string; signIn: string; error: string; connection: string }

type Props = {
  labels?: PhoneLabels
  listingId: string
  maskedPhone: string
  isAuthenticated: boolean
}

export function RevealListingPhoneButton({ listingId, maskedPhone, isAuthenticated, labels }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const revealing = useRef(false)

  function revealPhone() {
    if (revealing.current || phone) return
    revealing.current = true

    startTransition(async () => {
      try {
        const result = await revealListingPhone(listingId)
        if (!result.success) {
          if ('requiresLogin' in result && result.requiresLogin) {
            router.push('/login')
            return
          }

          toast.add({ title: labels?.error ?? 'Could not reveal phone', description: result.message, type: 'error' })
          return
        }

        setPhone(result.data.phone)
      } catch {
        toast.add({
          title: labels?.error ?? 'Could not reveal phone',
          description: labels?.connection ?? 'Check your connection and try again.',
          type: 'error'
        })
      } finally {
        revealing.current = false
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <Button
        nativeButton={false}
        variant="outline"
        size="lg"
        className="w-full"
        aria-label={labels?.signIn ?? `Sign in to reveal phone number ${maskedPhone}`}
        render={<Link href="/login" />}
      >
        <Phone aria-hidden="true" /> {maskedPhone}
      </Button>
    )
  }

  if (phone) {
    return (
      <Button nativeButton={false} variant="outline" size="lg" className="w-full" render={<a href={`tel:${phone.replace(/[^\d+]/g, '')}`} />}>
        <Phone aria-hidden="true" /> {phone}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={revealPhone}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={labels?.revealLabel ?? `Reveal phone number ${maskedPhone}`}
    >
      {isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Phone aria-hidden="true" />}
      {isPending ? (labels?.revealing ?? 'Revealing...') : `${maskedPhone} ${labels?.reveal ?? 'Reveal'}`}
    </Button>
  )
}
