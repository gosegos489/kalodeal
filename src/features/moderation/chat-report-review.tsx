import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getReportReasonLabel } from '@/features/messages/report-schema'
import { requireModerator } from '@/lib/auth-utils'
import { hasActiveBan } from '@/lib/ban-status'
import { ModerationTime } from './chat-report-queue'
import { chatReports } from './chat-report-server'
import { ModeratorConversationHistory } from './moderator-conversation-history'
import { ResolveReportButton } from './resolve-report-button'
import { UserBanControls } from './user-ban-controls'

export async function ChatReportReview({ id, before }: { id: string; before?: string | string[] }) {
  await requireModerator()
  const report = await chatReports.getReport(id)
  if (!report) notFound()
  const { conversation, reportedUser } = report
  return (
    <section className="flex min-w-0 flex-col gap-6">
      <Link href="/moderator/chat-reports" className="text-primary text-sm underline">
        Back to chat reports
      </Link>
      <div className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5">
        <h2 className="text-2xl font-semibold">Report review</h2>
        <Badge className="w-fit" variant={report.status === 'OPEN' ? 'default' : 'secondary'}>
          {report.status}
        </Badge>
        <p className="wrap-anywhere">
          Reporter: {report.reporter.name} · {report.reporter.email}
        </p>
        <p className="wrap-anywhere">
          Reported user: {reportedUser.name} · {reportedUser.email}
        </p>
        <p>Reason: {getReportReasonLabel(report.reason)}</p>
        {report.details && <p className="text-muted-foreground wrap-anywhere whitespace-pre-wrap">{report.details}</p>}
        <p className="text-sm">
          Submitted: <ModerationTime date={report.createdAt} />
        </p>
        {report.reviewedAt && (
          <p className="text-sm">
            Resolved by {report.reviewedBy?.name ?? 'Deleted reviewer'} · <ModerationTime date={report.reviewedAt} />
          </p>
        )}
        <p className="wrap-anywhere">
          Listing: {conversation.listing?.title ?? conversation.listingTitle}
          {!conversation.listing && ' (deleted)'}
        </p>
        <p className="text-muted-foreground text-xs wrap-anywhere">Conversation ID: {conversation.id}</p>
        <div className="flex flex-wrap items-start gap-3">
          <Button nativeButton={false} variant="outline" render={<Link href={`/moderator/users?q=${encodeURIComponent(reportedUser.id)}`} />}>
            Open user
          </Button>
          {conversation.listingId && (
            <Button nativeButton={false} variant="outline" render={<Link href={`/moderator/listings/${conversation.listingId}`} />}>
              Review listing
            </Button>
          )}
          {conversation.listing?.status === 'ACTIVE' && (
            <Button nativeButton={false} variant="outline" render={<Link href={`/listings/${conversation.listing.id}`} />}>
              Open listing
            </Button>
          )}
          {report.canManageBan && <UserBanControls userId={reportedUser.id} name={reportedUser.name} banned={hasActiveBan(reportedUser)} />}
          {report.status === 'OPEN' && <ResolveReportButton reportId={report.id} />}
        </div>
      </div>
      <ModeratorConversationHistory conversationId={conversation.id} before={before} href={`/moderator/chat-reports/${report.id}`} />
    </section>
  )
}
