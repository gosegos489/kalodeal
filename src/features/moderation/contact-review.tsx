import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireModerator } from '@/lib/auth-utils'
import { ModerationTime } from './chat-report-queue'
import { ContactControls } from './contact-controls'
import { contactStatusLabels } from './contact-schema'
import { contactRequests } from './contact-server'

export async function ContactReview({ id }: { id: string }) {
  await requireModerator()
  const ticket = await contactRequests.getTicket(id)
  return (
    <section aria-labelledby="contact-detail-heading" className="flex min-w-0 flex-col gap-6">
      <Button nativeButton={false} variant="outline" className="w-fit" render={<Link href="/moderator/contact" />}>
        Back to contact requests
      </Button>
      <h2 id="contact-detail-heading" className="text-2xl font-semibold">
        Contact request
      </h2>
      {ticket ? (
        <Card className="min-w-0">
          <CardContent className="space-y-6">
            <dl className="grid min-w-0 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Ticket ID</dt>
                <dd className="wrap-anywhere">{ticket.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sender email</dt>
                <dd className="wrap-anywhere">{ticket.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Topic</dt>
                <dd className="capitalize">{ticket.question.toLowerCase()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge>{contactStatusLabels[ticket.status]}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>
                  <ModerationTime date={ticket.createdAt} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>
                  <ModerationTime date={ticket.updatedAt} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">First viewed</dt>
                <dd>{ticket.viewedAt ? <ModerationTime date={ticket.viewedAt} /> : 'Not viewed yet'}</dd>
              </div>
            </dl>
            <div>
              <h3 className="mb-2 text-sm font-medium">Message</h3>
              <p className="wrap-anywhere whitespace-pre-wrap">{ticket.message}</p>
            </div>
            <ContactControls id={ticket.id} status={ticket.status} updatedAt={ticket.updatedAt.toISOString()} unread={ticket.viewedAt === null} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-6">Contact request not found or no longer available.</p>
      )}
    </section>
  )
}
