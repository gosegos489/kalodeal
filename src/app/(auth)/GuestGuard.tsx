import { requireGuest } from '@/lib/auth-utils'

export default async function GuestGuard({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireGuest()

  return <main className="flex-1">{children}</main>
}
