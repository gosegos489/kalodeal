import { Check, CheckCheck, Clock3, TriangleAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { Fragment } from 'react'
import { getSellerInitials } from '@/entities/user/public-profile'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { cn } from '@/lib/utils'
import { formatMessageClock, formatMessageDay, formatMessageTime, messageDay } from './format-time'
import type { ChatMessage } from './types'

export type ChatParticipant = { id: string; name: string; avatar: string | null; role?: 'Buyer' | 'Seller' }
export type DisplayMessage = ChatMessage & { delivery?: 'sending' | 'failed' }

export function ChatAvatar({ name, url, online = false }: { name: string; url: string | null; online?: boolean }) {
  return (
    <span className="bg-muted relative flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium" aria-hidden="true">
      {url ? <Image src={url} alt="" width={40} height={40} className="size-10 rounded-full object-cover" /> : getSellerInitials(name)}
      {online && <span className="border-card absolute right-0 bottom-0 size-3 rounded-full border-2 bg-emerald-600" />}
    </span>
  )
}

export function ChatParticipantHeader({ participant, status, online }: { participant: ChatParticipant; status?: string; online?: boolean }) {
  const copy = createWorkspaceCopy(useTranslations('Workspace'))
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ChatAvatar name={participant.name} url={participant.avatar} online={online} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {participant.name}
          {participant.role && <span className="text-muted-foreground font-normal"> · {copy(participant.role)}</span>}
        </p>
        {status && (
          <p className="text-muted-foreground text-xs" role="status">
            {status}
          </p>
        )}
      </div>
    </div>
  )
}

export function ChatReadStatus({ status }: { status: 'sending' | 'failed' | 'sent' | 'seen' }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const Icon = status === 'seen' ? CheckCheck : status === 'sent' ? Check : status === 'sending' ? Clock3 : TriangleAlert
  const label = { seen: 'Seen', sent: 'Sent', sending: 'Sending', failed: 'Failed · retry below' }[status]
  return (
    <span className={cn('inline-flex items-center gap-1', status === 'failed' && 'text-destructive')}>
      <Icon aria-hidden="true" className="size-3" />
      {copy(label)}
    </span>
  )
}

export function ChatDateSeparator({ value, reference }: { value: string; reference: string }) {
  const t = useTranslations('Workspace')
  const locale = useLocale()
  const day = formatMessageDay(value, reference, locale, { today: t('today'), yesterday: t('yesterday') })
  return (
    <li className="flex items-center gap-3 py-2" aria-label={day}>
      <span className="bg-border h-px flex-1" />
      <span className="text-muted-foreground shrink-0 text-xs">{day}</span>
      <span className="bg-border h-px flex-1" />
    </li>
  )
}

export function ChatMessageBubble({
  message,
  right,
  participant,
  showLabel,
  status
}: {
  message: DisplayMessage
  right: boolean
  participant?: ChatParticipant
  showLabel?: boolean
  status?: 'sent' | 'seen'
}) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)
  const locale = useLocale()

  return (
    <li className={cn('flex min-w-0 flex-col gap-1', right ? 'items-end' : 'items-start')}>
      {showLabel && participant && (
        <span className="text-muted-foreground max-w-[90%] text-xs wrap-anywhere">
          {participant.name} · {participant.role && copy(participant.role)}
        </span>
      )}
      <p
        className={cn(
          'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap sm:max-w-[80%]',
          right ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
          message.delivery === 'sending' && 'opacity-70',
          message.delivery === 'failed' && 'ring-destructive ring-1'
        )}
      >
        {message.content}
      </p>
      <div className="text-muted-foreground flex max-w-[90%] flex-wrap items-center gap-x-2 text-[11px]">
        <time dateTime={message.createdAt} title={formatMessageTime(message.createdAt, locale)}>
          <span className="sr-only">{participant?.name ?? (right ? t('you') : t('participant'))}, </span>
          {formatMessageClock(message.createdAt, locale)}
        </time>
        {(message.delivery || status) && <ChatReadStatus status={message.delivery ?? status ?? 'sent'} />}
      </div>
    </li>
  )
}

// Pure presentation: usable from Server Components and interactive participant chat.
export function ChatMessageList({
  messages,
  rightSenderId,
  participants,
  readBySender,
  reference,
  showLabels = false,
  live = false
}: {
  messages: DisplayMessage[]
  rightSenderId: string
  participants: ChatParticipant[]
  readBySender: Record<string, number>
  reference: string
  showLabels?: boolean
  live?: boolean
}) {
  const t = useTranslations('Workspace')

  const lastSent = new Map<string, string>()
  const lastSeen = new Map<string, string>()
  for (const message of messages) {
    if (message.delivery) continue
    lastSent.set(message.senderId, message.id)
    if (message.sequence <= (readBySender[message.senderId] ?? -1)) lastSeen.set(message.senderId, message.id)
  }
  return (
    <ol
      aria-label={t('messages')}
      aria-live={live ? 'polite' : undefined}
      aria-relevant={live ? 'additions' : undefined}
      className="flex min-w-0 flex-col gap-3"
    >
      {messages.map((message, index) => {
        const participant = participants.find((person) => person.id === message.senderId)
        const seen = lastSeen.get(message.senderId) === message.id
        const status =
          message.senderId in readBySender ? (seen ? 'seen' : lastSent.get(message.senderId) === message.id ? 'sent' : undefined) : undefined
        return (
          <Fragment key={message.id}>
            {(index === 0 || messageDay(messages[index - 1].createdAt) !== messageDay(message.createdAt)) && (
              <ChatDateSeparator value={message.createdAt} reference={reference} />
            )}
            <ChatMessageBubble
              message={message}
              right={message.senderId === rightSenderId}
              participant={participant}
              showLabel={showLabels}
              status={status}
            />
          </Fragment>
        )
      })}
    </ol>
  )
}
