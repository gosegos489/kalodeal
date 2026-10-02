import { ShieldCheck } from 'lucide-react'
import { AccountPlaceholder } from '@/features/account/account-placeholder'

export default function SecurityPage() {
  return (
    <AccountPlaceholder title="Security" description="Account security settings and session management are not available yet." icon={ShieldCheck} />
  )
}
