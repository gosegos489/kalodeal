import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requireModerator } from '@/lib/auth-utils'
import { ModerationTime } from './chat-report-queue'
import { chatReports } from './chat-report-server'
import { ChatReportError } from './chat-report-workflow'

export async function ModeratorConversationHistory({
  conversationId,
  before,
  href
}: {
  conversationId: string
  before?: string | string[]
  href: string
}) {
  await requireModerator()
  let history
  try {
    history = await chatReports.getHistory({ conversationId, ...(before === undefined ? {} : { before }) })
  } catch (error) {
    if (!(error instanceof ChatReportError)) throw error
    return (
      <p role="alert" className="text-destructive">
        Invalid history page.{' '}
        <Link href={href} className="underline">
          Show latest messages
        </Link>
      </p>
    )
  }
  return (
    <section className="bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-4" aria-label="Conversation history">
      <h3 className="text-lg font-semibold">Conversation history</h3>
      <p className="text-muted-foreground text-sm">Read-only snapshot. Reviewing does not mark participants’ messages as read.</p>
      <div className="flex flex-wrap gap-2">
        {history.hasMore && (
          <Button nativeButton={false} variant="outline" render={<Link href={`${href}?before=${history.nextBefore}`} />}>
            Load older messages
          </Button>
        )}
        {before !== undefined && (
          <Button nativeButton={false} variant="outline" render={<Link href={href} />}>
            Latest messages
          </Button>
        )}
      </div>
      {history.messages.length ? (
        <ol className="flex flex-col gap-4">
          {history.messages.map((message) => (
            <li key={message.id} className="bg-muted flex min-w-0 flex-col gap-2 rounded-lg p-3">
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span className="font-medium wrap-anywhere">{message.sender.name}</span>
                <ModerationTime date={message.createdAt} />
              </div>
              <p className="text-sm wrap-anywhere whitespace-pre-wrap">{message.content}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">No messages on this page.</p>
      )}
    </section>
  )
}
