'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
import { createRouteRefreshPoller } from './route-refresh-poller'

const REFRESH_INTERVAL_MS = 25_000

export function RouteAutoRefresh({ refreshOnFocus = false }: { refreshOnFocus?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const poller = useRef<ReturnType<typeof createRouteRefreshPoller> | null>(null)

  useEffect(() => {
    const current = createRouteRefreshPoller({
      refresh: () => startTransition(() => router.refresh()),
      isVisible: () => document.visibilityState === 'visible',
      schedule: (callback) => {
        const timer = window.setTimeout(callback, REFRESH_INTERVAL_MS)
        return () => window.clearTimeout(timer)
      }
    })
    poller.current = current
    current.start()
    document.addEventListener('visibilitychange', current.visibilityChanged)
    if (refreshOnFocus) window.addEventListener('focus', current.visibilityChanged)
    return () => {
      current.stop()
      document.removeEventListener('visibilitychange', current.visibilityChanged)
      if (refreshOnFocus) window.removeEventListener('focus', current.visibilityChanged)
      poller.current = null
    }
  }, [router, startTransition, refreshOnFocus])

  useEffect(() => {
    // router.refresh() returns void; its React transition tracks the RSC commit.
    poller.current?.setPending(pending)
  }, [pending])

  return null
}
