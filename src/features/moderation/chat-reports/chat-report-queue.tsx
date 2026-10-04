import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getReportReasonLabel } from '@/features/messages/report-schema'
import { requireModerator } from '@/lib/auth-utils'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import { ModerationTime } from '../shared/moderation-time'
import type { ModerationSearchParams } from '../shared/search'
import { chatReports } from './chat-report-server'

export async function ChatReportQueue(params: ModerationSearchParams) {
  await requireModerator()
  const { reports, status, totalItems, totalPages } = await chatReports.getReports(params)
  return (
    <section aria-labelledby="chat-reports-heading" className="flex min-w-0 flex-col gap-6">
      <RouteAutoRefresh />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chat-reports-heading" className="text-2xl font-semibold">
            Chat reports
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Review reported conversations. New open reports appear first.</p>
        </div>
        <Button nativeButton={false} variant="outline" render={<Link href="/moderator/chat-reports/lookup" />}>
          Conversation lookup
        </Button>
      </div>
      <nav aria-label="Report status" className="flex flex-wrap gap-2">
        {['OPEN', 'RESOLVED', 'ALL'].map((value) => (
          <Button
            key={value}
            nativeButton={false}
            variant={status === value ? 'default' : 'outline'}
            render={<Link href={`/moderator/chat-reports?status=${value}`} aria-current={status === value ? 'page' : undefined} />}
          >
            {value === 'ALL' ? 'All reports' : value === 'OPEN' ? 'Open' : 'Resolved'}
          </Button>
        ))}
      </nav>
      <p className="text-muted-foreground text-sm">{totalItems} reports</p>
      {reports.length ? (
        reports.map((report) => (
          <Card key={report.id} className="min-w-0">
            <CardContent className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium wrap-anywhere">
                  Reported: {report.reportedUser.name} · {report.reportedUser.email}
                </p>
                <p className="text-muted-foreground text-sm wrap-anywhere">
                  Reporter: {report.reporter.name} · {report.reporter.email}
                </p>
                <p className="text-sm">{getReportReasonLabel(report.reason)}</p>
                <p className="text-muted-foreground text-sm wrap-anywhere">
                  {report.conversation.listing?.title ?? report.conversation.listingTitle}
                </p>
                <p className="text-muted-foreground text-xs wrap-anywhere">Conversation: {report.conversation.id}</p>
                <p className="text-muted-foreground text-xs">
                  <ModerationTime date={report.createdAt} />
                </p>
                <Badge variant={report.status === 'OPEN' ? 'default' : 'secondary'}>{report.status}</Badge>
              </div>
              <Button nativeButton={false} variant="outline" render={<Link href={`/moderator/chat-reports/${report.id}`} />}>
                Review
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-6">No reports found.</p>
      )}
      <NuqsPagination totalPages={totalPages} ariaLabel="Chat report pages" />
    </section>
  )
}
