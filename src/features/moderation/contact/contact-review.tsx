import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireModerator } from '@/lib/auth-utils'
import { dayjs } from '@/lib/dayjs'
import { ContactControls } from './contact-controls'
import { contactStatusLabels } from './contact-schema'
import { contactRequests } from './contact-server'
import { ContactViewed } from './contact-viewed'
import { CopyTicketId } from './copy-ticket-id'

function ContactTime({ date }: { date: Date }) {
  return <time dateTime={date.toISOString()}>{dayjs.utc(date).format('D MMM YYYY, HH:mm [UTC]')}</time>
}

export async function ContactReview({ id }: { id: string }) {
  await requireModerator()
  const ticket = await contactRequests.getTicket(id)
  return (
    <section aria-labelledby="contact-detail-heading" className="flex max-w-3xl min-w-0 flex-col gap-6">
      <Button nativeButton={false} variant="outline" className="w-fit" render={<Link href="/moderator/contact" />}>
        Back to contact requests
      </Button>
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h2 id="contact-detail-heading" className="text-2xl font-semibold">
            Contact request
          </h2>
          {ticket && (
            <Badge variant={ticket.status === 'CLOSED' ? 'secondary' : 'default'} className="mt-1">
              {contactStatusLabels[ticket.status]}
            </Badge>
          )}
        </div>
        {ticket && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="capitalize">{ticket.question.toLowerCase()}</span>
            <span>
              Created <ContactTime date={ticket.createdAt} />
            </span>
          </div>
        )}
      </header>
      {ticket ? (
        <>
          {ticket.viewedAt === null && <ContactViewed id={ticket.id} />}
          <section aria-labelledby="contact-sender-heading" className="space-y-1">
            <h3 id="contact-sender-heading" className="text-muted-foreground text-sm">
              Sender
            </h3>
            <p className="text-lg font-medium wrap-anywhere">{ticket.contactEmail}</p>
          </section>
          <Card className="min-w-0 py-6">
            <CardHeader className="px-6">
              <h3 className="font-medium">Message</h3>
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-base leading-relaxed wrap-anywhere whitespace-pre-wrap">{ticket.message}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <ContactControls id={ticket.id} status={ticket.status} updatedAt={ticket.updatedAt.toISOString()} />
            </CardContent>
          </Card>
          <section aria-labelledby="contact-ticket-details-heading" className="space-y-4 border-t pt-6">
            <h3 id="contact-ticket-details-heading" className="text-muted-foreground text-sm font-medium">
              Ticket details
            </h3>
            <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-muted-foreground">Ticket ID</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-mono text-xs wrap-anywhere">{ticket.id}</span>
                  <CopyTicketId id={ticket.id} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>
                  <ContactTime date={ticket.createdAt} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>
                  <ContactTime date={ticket.updatedAt} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">First viewed</dt>
                <dd>{ticket.viewedAt ? <ContactTime date={ticket.viewedAt} /> : 'Not viewed yet'}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-6">Contact request not found or no longer available.</p>
      )}
    </section>
  )
}
