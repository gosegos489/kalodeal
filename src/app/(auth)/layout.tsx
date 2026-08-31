import { Suspense } from 'react'
import { PublicFooter } from '@/widgets/public-footer/PublicFooter'
import { PublicHeader } from '@/widgets/public-header/PublicHeader'
import GuestGuard from './GuestGuard'

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <Suspense fallback={null}>
        <GuestGuard> {children}</GuestGuard>
      </Suspense>

      <PublicFooter />
    </div>
  )
}
