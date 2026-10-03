import { ModeratorNavigation } from './moderator-navigation'

export function ModeratorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex min-w-0 flex-col gap-8 py-10">
      <header className="flex flex-col gap-2 border-b pb-6">
        <p className="text-primary text-xs font-semibold uppercase">KaloDeal moderation</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Moderator</h1>
        <p className="text-muted-foreground text-sm">Review listings, profile names, avatars and chat reports, and manage account access.</p>
      </header>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="bg-card min-w-0 rounded-xl border lg:sticky lg:top-24">
          <ModeratorNavigation />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
