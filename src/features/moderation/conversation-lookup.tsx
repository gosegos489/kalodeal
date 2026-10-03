import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireModerator } from '@/lib/auth-utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { chatReports } from './chat-report-server'
import { ModeratorConversationHistory } from './moderator-conversation-history'
import type { ModerationSearchParams } from './search'

export async function ConversationLookup(params: ModerationSearchParams) {
  await requireModerator()
  const { conversations, query, totalPages } = await chatReports.searchConversations(params.q, params.page)
  return (
    <section className="flex min-w-0 flex-col gap-6">
      <Link href="/moderator/chat-reports" className="text-primary text-sm underline">
        Back to chat reports
      </Link>
      <div>
        <h2 className="text-2xl font-semibold">Conversation lookup</h2>
        <p className="text-muted-foreground mt-1 text-sm">Search for a specific moderation or support case.</p>
      </div>
      <form action="/moderator/chat-reports/lookup" className="flex flex-col gap-3">
        <label htmlFor="conversation-lookup">Conversation ID, user name/email or listing ID/title</label>
        <Input id="conversation-lookup" name="q" type="search" maxLength={150} defaultValue={query} required />
        <Button type="submit" className="w-fit">
          Search
        </Button>
      </form>
      {conversations.map((conversation) => (
        <div key={conversation.id} className="bg-card flex min-w-0 flex-col gap-2 rounded-xl border p-4">
          <p className="font-medium wrap-anywhere">{conversation.listing?.title ?? conversation.listingTitle}</p>
          <p className="text-muted-foreground text-sm wrap-anywhere">
            {conversation.buyer.name} · {conversation.buyer.email} ↔ {conversation.seller.name} · {conversation.seller.email}
          </p>
          <p className="text-muted-foreground text-xs wrap-anywhere">{conversation.id}</p>
          <Link className="text-primary text-sm underline" href={`/moderator/chat-reports/lookup/${conversation.id}`}>
            Read conversation
          </Link>
        </div>
      ))}
      {!conversations.length && (
        <p className="text-muted-foreground text-sm">{query ? 'No conversations found.' : 'Enter a search to find a conversation.'}</p>
      )}
      <NuqsPagination totalPages={totalPages} ariaLabel="Conversation lookup pages" />
    </section>
  )
}

export async function ConversationLookupReview({ id, before }: { id: string; before?: string | string[] }) {
  await requireModerator()
  const conversation = await chatReports.getConversation(id)
  if (!conversation) notFound()
  return (
    <section className="flex min-w-0 flex-col gap-6">
      <Link href="/moderator/chat-reports/lookup" className="text-primary text-sm underline">
        Back to lookup
      </Link>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold wrap-anywhere">{conversation.listing?.title ?? conversation.listingTitle}</h2>
        <p className="text-muted-foreground text-sm wrap-anywhere">
          {conversation.buyer.name} · {conversation.buyer.email} ↔ {conversation.seller.name} · {conversation.seller.email}
        </p>
        <p className="text-muted-foreground text-xs wrap-anywhere">Conversation: {conversation.id}</p>
        {conversation.listingId && (
          <Link href={`/moderator/listings/${conversation.listingId}`} className="text-primary text-sm underline">
            Review listing
          </Link>
        )}
      </div>
      <ModeratorConversationHistory conversationId={conversation.id} before={before} href={`/moderator/chat-reports/lookup/${conversation.id}`} />
    </section>
  )
}
