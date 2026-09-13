import { Suspense } from 'react'
import { requireUser } from '@/lib/auth-utils'
import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'

async function ProtectedGuard({ children }: { children: React.ReactNode }) {
  await requireUser()

  return children
}

export default function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={null}>
          <ProtectedGuard>{children}</ProtectedGuard>
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  )
}
