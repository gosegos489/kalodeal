import { UserRound } from 'lucide-react'
import { AccountPlaceholder } from '@/features/account/account-placeholder'

export default function ProfilePage() {
  return (
    <AccountPlaceholder
      title="Profile"
      description="Profile editing is not available yet. Your current account details are shown on the account overview."
      icon={UserRound}
    />
  )
}
