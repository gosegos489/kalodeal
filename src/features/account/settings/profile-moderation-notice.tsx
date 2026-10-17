import { Clock3, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getSellerName } from '@/entities/user/public-profile'

export function AwaitingModeration() {
  const t = useTranslations('Workspace')

  return (
    <Badge variant="secondary" role="status">
      <Clock3 aria-hidden="true" />
      {t('awaitingModeration')}
    </Badge>
  )
}

export function ProfileModerationFeedback({ kind, message }: { kind: 'name' | 'avatar'; message: string | null }) {
  const t = useTranslations('Workspace')

  if (!message) return null
  return (
    <Alert role="status">
      <MessageSquare aria-hidden="true" />
      <AlertTitle>{kind === 'name' ? t('profileChangeRequested') : t('avatarChangeRequested')}</AlertTitle>
      <AlertDescription className="wrap-anywhere whitespace-pre-wrap">{message}</AlertDescription>
    </Alert>
  )
}

export function PendingNameNotice({ name, pendingName }: { name: string; pendingName: string | null }) {
  const t = useTranslations('Workspace')

  if (!pendingName) return null
  return (
    <p role="status" className="text-muted-foreground text-sm">
      {t('yourNewNameIsAwaitingModerationYourCurrentPublicNameWillRemainUnchangedUntilItIsAppro')}
      {getSellerName(name) === 'Seller' && t('untilApprovedYourListingsWillContinueToShowSeller')}
    </p>
  )
}
