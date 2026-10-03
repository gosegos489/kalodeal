import { Clock3, MessageSquare } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getSellerName } from '@/entities/user/public-profile'

export function AwaitingModeration() {
  return (
    <Badge variant="secondary" role="status">
      <Clock3 aria-hidden="true" />
      Awaiting moderation
    </Badge>
  )
}

export function ProfileModerationFeedback({ kind, message }: { kind: 'name' | 'avatar'; message: string | null }) {
  if (!message) return null
  return (
    <Alert role="status">
      <MessageSquare aria-hidden="true" />
      <AlertTitle>{kind === 'name' ? 'Profile change requested' : 'Avatar change requested'}</AlertTitle>
      <AlertDescription className="wrap-anywhere whitespace-pre-wrap">{message}</AlertDescription>
    </Alert>
  )
}

export function PendingNameNotice({ name, pendingName }: { name: string; pendingName: string | null }) {
  if (!pendingName) return null
  return (
    <p role="status" className="text-muted-foreground text-sm">
      Your new name is awaiting moderation. Your current public name will remain unchanged until it is approved.
      {getSellerName(name) === 'Seller' && ' Until approved, your listings will continue to show “Seller”.'}
    </p>
  )
}
