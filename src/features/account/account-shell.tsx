import { AccountNavigation } from './account-navigation'

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6">
        <p className="text-primary text-xs font-semibold uppercase">Your space on KaloDeal</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">My account</h1>
        <p className="text-muted-foreground text-sm">Your listings, plan and account details in one place.</p>
      </header>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:bg-card min-w-0 lg:sticky lg:top-24 lg:rounded-xl lg:border">
          <AccountNavigation />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
