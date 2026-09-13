import { Suspense } from 'react'
import { requireGuest } from '@/lib/auth-utils'
import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'

async function GuestGuard({ children }: { children: React.ReactNode }) {
  await requireGuest()

  return children
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main className="flex-1">
        <Suspense fallback={null}>
          <GuestGuard>{children}</GuestGuard>
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  )
}
