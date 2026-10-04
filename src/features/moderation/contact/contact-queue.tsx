import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { requireModerator } from '@/lib/auth-utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import { ModerationTime } from '../shared/moderation-time'
import { type ContactSearchParams, contactStatusLabels } from './contact-schema'
import { contactRequests } from './contact-server'

export async function ContactQueue(params: ContactSearchParams) {
  await requireModerator()
  const { tickets, status, query, totalItems, totalPages } = await contactRequests.getTickets(params)
  return (
    <section aria-labelledby="contact-heading" className="flex min-w-0 flex-col gap-6">
      <RouteAutoRefresh refreshOnFocus />
      <div>
        <h2 id="contact-heading" className="text-2xl font-semibold">
          Contact requests
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Incoming support requests, newest first. Updates automatically while this tab is visible.
        </p>
      </div>
      <form action="/moderator/contact" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="status" value={status} />
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="contact-search" className="text-sm font-medium">
            Search by email, ticket ID or topic
          </label>
          <Input id="contact-search" name="q" type="search" defaultValue={query} maxLength={150} />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <nav aria-label="Contact request status" className="flex flex-wrap gap-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'UNREAD'] as const).map((value) => {
          const search = new URLSearchParams({ status: value })
          if (query) search.set('q', query)
          return (
            <Button
              key={value}
              nativeButton={false}
              variant={status === value ? 'default' : 'outline'}
              render={<Link href={`/moderator/contact?${search}`} aria-current={status === value ? 'page' : undefined} />}
            >
              {value === 'ALL' ? 'All' : value === 'UNREAD' ? 'Unread' : contactStatusLabels[value]}
            </Button>
          )
        })}
      </nav>
      <p className="text-muted-foreground text-sm">{totalItems} requests</p>
      {tickets.length ? (
        tickets.map((ticket) => (
          <Card key={ticket.id} className="min-w-0">
            <CardContent className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium wrap-anywhere">{ticket.contactEmail}</p>
                <p className="text-sm capitalize">{ticket.question.toLowerCase()}</p>
                <p className="text-muted-foreground text-sm wrap-anywhere whitespace-pre-wrap">{ticket.preview}</p>
                <p className="text-muted-foreground text-xs wrap-anywhere">Ticket: {ticket.id}</p>
                <p className="text-muted-foreground text-xs">
                  <ModerationTime date={ticket.createdAt} />
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'}>{contactStatusLabels[ticket.status]}</Badge>
                  {ticket.viewedAt === null && <Badge variant="outline">New</Badge>}
                </div>
              </div>
              <Button nativeButton={false} variant="outline" render={<Link prefetch={false} href={`/moderator/contact/${ticket.id}`} />}>
                Open request
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-6">No contact requests found.</p>
      )}
      <NuqsPagination totalPages={totalPages} ariaLabel="Contact request pages" />
    </section>
  )
}
