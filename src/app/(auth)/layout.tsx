import { PublicFooter } from '@/widgets/public-footer/PublicFooter'
import { PublicHeader } from '@/widgets/public-header/PublicHeader'

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
