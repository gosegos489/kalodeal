'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

const MAX_REFRESHES = 10
const REFRESH_DELAY_MS = 2000

export function CheckoutPending() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (pending || attempts >= MAX_REFRESHES) return
    const timeout = setTimeout(() => {
      setAttempts((count) => count + 1)
      startTransition(() => router.refresh())
    }, REFRESH_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [attempts, pending, router])

  return (
    <p>
      {attempts >= MAX_REFRESHES && !pending
        ? 'Payment confirmation is taking longer than expected. Your plan will be available once confirmation is received.'
        : 'Payment confirmation is being processed. Your plan will appear here automatically once it is confirmed.'}
    </p>
  )
}
