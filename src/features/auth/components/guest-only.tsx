import { getLocale } from 'next-intl/server'
import 'server-only'
import type { ReactNode } from 'react'
import { requireGuest } from '@/lib/auth-utils'

// Keep the guest redirect ahead of the form while its public page shell streams.
export async function GuestOnly({ children }: { children: ReactNode }) {
  await requireGuest(await getLocale())
  return children
}
