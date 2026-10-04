'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { markContactViewed } from './contact-actions'

export function ContactViewed({ id }: { id: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    startTransition(async () => {
      const result = await markContactViewed(id).catch(() => ({ success: false, message: 'Please reload to try again.' }))
      if (active && !result.success) {
        toast.add({ title: 'Could not mark as viewed', description: result.message, type: 'error' })
        router.refresh()
      }
    })
    return () => {
      active = false
    }
  }, [id, router, startTransition])

  return null
}
