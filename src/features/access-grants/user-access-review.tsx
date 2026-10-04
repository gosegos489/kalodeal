import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLAN_LIMITS, isActivePlanGrant } from '@/lib/plan-limits'
import NuqsPagination from '@/shared/ui/NuqsPagination'
import { RouteAutoRefresh } from '@/shared/ui/route-auto-refresh'
import { type GrantHistoryParams, getAccessGrantUser } from './data'
import { formatGrantDate } from './format'
import { GrantControls } from './grant-controls'
import { GrantUserIdentity } from './user-identity'

const historyColumns = ['Type', 'Plan / amount', 'Granted by', 'Created', 'Expires', 'Remaining', 'Status']

function History({ title, children, totalPages, pageKey }: { title: string; children: React.ReactNode; totalPages: number; pageKey: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {historyColumns.map((label) => (
                  <th key={label} scope="col" className="px-3 py-2 whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
        <NuqsPagination totalPages={totalPages} pageKey={pageKey} ariaLabel={`${title} pages`} />
      </CardContent>
    </Card>
  )
}

export async function UserAccessReview({ userId, params }: { userId: unknown; params: GrantHistoryParams }) {
  const data = await getAccessGrantUser(userId, params)
  if (!data) notFound()
  const { user, access, now } = data
  const subscription = access.subscription
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby="user-access-heading">
      <RouteAutoRefresh />
      <Link href="/moderator/access-grants" className="text-primary text-sm hover:underline">
        Back to access grants
      </Link>
      <h2 id="user-access-heading" className="text-2xl font-semibold">
        User access
      </h2>
      <Card>
        <CardContent>
          <GrantUserIdentity user={user} />
        </CardContent>
      </Card>
      {user.banned && (
        <p role="status" className="border-destructive/40 rounded-lg border p-4 text-sm">
          This account is banned. Grants will not restore sign-in or marketplace access.
        </p>
      )}
      {user.role === 'moderator' && (
        <p className="text-muted-foreground text-sm">Moderator accounts cannot use marketplace features, even with a grant.</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Current access</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>
            Effective plan: <Badge>{access.plan}</Badge>
          </p>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium">Paid subscription</dt>
              <dd className="text-muted-foreground mt-2 text-sm">
                {access.paidPlan === 'PRO' ? (
                  <>
                    PRO · {subscription?.status === 'CANCELED' ? 'Ends' : 'Renews'}: {formatGrantDate(subscription?.currentPeriodEnd ?? null)}
                  </>
                ) : subscription?.stripeSubscriptionId ? (
                  <>
                    No active paid PRO · {subscription.status}
                    <br />
                    Last paid period ends: {formatGrantDate(subscription.currentPeriodEnd)}
                  </>
                ) : (
                  'None'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Manual PRO</dt>
              <dd className="text-muted-foreground mt-2 text-sm">
                {access.manualGrant ? `Active · Expires: ${formatGrantDate(access.manualGrant.endsAt)}` : 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Plan bumps</dt>
              <dd className="text-muted-foreground mt-2 text-sm">
                {access.planBumpsRemaining} / {PLAN_LIMITS[access.plan].monthlyBumps} remaining
                {access.planBumpSource ? ` · ${access.planBumpSource}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Bonus bumps</dt>
              <dd className="text-muted-foreground mt-2 text-sm">{access.bonusBumpsRemaining} remaining</dd>
            </div>
          </dl>
          <GrantControls userId={user.id} manualGrantId={access.manualGrant?.id ?? null} />
          <p className="text-muted-foreground text-xs">
            Bumps use expiring bonus credits first, then the current plan allowance, then bonus credits without expiration. Paid and complimentary
            plan allowances do not stack.
          </p>
        </CardContent>
      </Card>
      <History title="PRO grant history" totalPages={data.proPagination.totalPages} pageKey="proPage">
        {data.proGrants.map((grant) => (
          <tr key={grant.id} className="border-t [&>td]:px-3 [&>td]:py-3">
            <td>PRO</td>
            <td>{grant.plan}</td>
            <td className="wrap-anywhere">{grant.grantedBy.email}</td>
            <td>{formatGrantDate(grant.createdAt)}</td>
            <td>{formatGrantDate(grant.endsAt)}</td>
            <td>—</td>
            <td>
              {grant.revokedAt ? 'Revoked' : isActivePlanGrant(grant, now) ? 'Active' : grant.startsAt > now ? 'Scheduled' : 'Expired'}
              {grant.reason && <p className="text-muted-foreground mt-1 max-w-xs text-xs wrap-anywhere">{grant.reason}</p>}
            </td>
          </tr>
        ))}
        {!data.proGrants.length && (
          <tr>
            <td colSpan={7} className="text-muted-foreground p-3">
              No PRO grants.
            </td>
          </tr>
        )}
      </History>
      <History title="Bonus bump history" totalPages={data.bumpsPagination.totalPages} pageKey="bumpsPage">
        {data.bumpGrants.map((grant) => (
          <tr key={grant.id} className="border-t [&>td]:px-3 [&>td]:py-3">
            <td>Bumps</td>
            <td>+{grant.total}</td>
            <td className="wrap-anywhere">{grant.grantedBy.email}</td>
            <td>{formatGrantDate(grant.createdAt)}</td>
            <td>{formatGrantDate(grant.expiresAt)}</td>
            <td>{grant.remaining}</td>
            <td>
              {grant.expiresAt && grant.expiresAt <= now ? 'Expired' : grant.remaining === 0 ? 'Used' : 'Available'}
              {grant.reason && <p className="text-muted-foreground mt-1 max-w-xs text-xs wrap-anywhere">{grant.reason}</p>}
            </td>
          </tr>
        ))}
        {!data.bumpGrants.length && (
          <tr>
            <td colSpan={7} className="text-muted-foreground p-3">
              No bonus bump grants.
            </td>
          </tr>
        )}
      </History>
    </section>
  )
}
