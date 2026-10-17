import { getTranslations } from 'next-intl/server'
import { AccountShell } from '@/features/account/account-shell'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>
}

export async function generateMetadata() {
  const t = await getTranslations('Workspace')
  return { title: t('myAccount') }
}
