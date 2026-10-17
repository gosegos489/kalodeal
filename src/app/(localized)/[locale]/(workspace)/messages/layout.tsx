import { AccountShell } from '@/features/account/account-shell'

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>
}
