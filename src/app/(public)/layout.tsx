import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'

export default function PublicLayout({
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
