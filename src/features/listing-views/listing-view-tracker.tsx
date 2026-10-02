'use client'

import { useEffect } from 'react'

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    let disposed = false
    let sent = false
    let timer: ReturnType<typeof setTimeout> | undefined
    async function send() {
      if (disposed || document.visibilityState !== 'visible' || sent) return
      sent = true
      try {
        const record = async () => {
          if (!disposed) await fetch(`/api/listings/${encodeURIComponent(listingId)}/view`, { method: 'POST', credentials: 'same-origin' })
        }
        // Serialize first-cookie creation across tabs where Web Locks is supported.
        if (navigator.locks) await navigator.locks.request('kalodeal-listing-view', record)
        else await record()
      } catch {
        // Analytics failure must not prevent visitors from using the listing.
      }
    }
    function schedule() {
      clearTimeout(timer)
      if (document.visibilityState === 'visible') timer = setTimeout(send, 1000)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      disposed = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [listingId])
  return null
}
