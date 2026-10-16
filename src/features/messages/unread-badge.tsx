'use client'

import { useMessaging } from '@/app/chat-provider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatUnreadBadge } from './format-time'

export function UnreadMessagesBadge({ className, formatLabel }: { className?: string; formatLabel?: (count: number, label: string) => string }) {
  const { unreadCount } = useMessaging()
  const label = formatUnreadBadge(unreadCount)
  return label ? (
    <Badge
      className={cn('min-w-6 justify-center px-1.5 tabular-nums', className)}
      aria-label={formatLabel?.(unreadCount, label) ?? `${label} unread messages`}
    >
      {label}
    </Badge>
  ) : null
}
