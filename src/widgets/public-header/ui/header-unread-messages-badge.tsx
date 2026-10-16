'use client'

import { useTranslations } from 'next-intl'
import { UnreadMessagesBadge } from '@/features/messages/unread-badge'

export function HeaderUnreadMessagesBadge({ className }: { className?: string }) {
  const t = useTranslations('Navigation')
  return <UnreadMessagesBadge className={className} formatLabel={(count, label) => t('unreadMessages', { count, label })} />
}
