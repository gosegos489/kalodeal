'use client'

import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { type Locale, localizeHref } from '@/i18n/routing'
import { authClient } from '@/lib/auth-client'

export function LogoutButton({
  locale = 'en',
  labels = { logout: 'Logout', loggingOut: 'Logging out…', error: 'Could not log out', retry: 'Please try again.' }
}: {
  locale?: Locale
  labels?: { logout: string; loggingOut: string; error: string; retry: string }
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const result = await authClient.signOut()
      if (result.error) {
        toast.add({ title: labels.error, description: labels.retry, type: 'error' })
        setIsLoggingOut(false)
        return
      }

      // Reload so cached account pages and server-rendered session UI are cleared.
      window.location.replace(localizeHref('/', locale))
    } catch {
      toast.add({ title: labels.error, description: labels.retry, type: 'error' })
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      onClick={handleLogout}
      className="text-muted-foreground h-auto justify-start gap-3 px-3 py-3 font-normal"
    >
      {isLoggingOut ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LogOut aria-hidden="true" className="size-4" />}
      {isLoggingOut ? labels.loggingOut : labels.logout}
    </Button>
  )
}
