import { ReceiptText } from 'lucide-react'
import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPaymentAmount } from '@/features/billing/format-payment-amount'
import { getMySubscriptionPayments } from '@/features/orders/data'
import { InvoiceActions } from '@/features/orders/invoice-actions'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { serializePagination } from '@/lib/pagination'
import { LoadingStatus } from '@/shared/ui/loading-status'
import NuqsPagination from '@/shared/ui/workspace-pagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Workspace')
  return { title: t('orders'), robots: { index: false, follow: false } }
}

async function Orders({ searchParams }: Props) {
  const t = await getTranslations('Workspace')
  const locale = await getLocale()
  const copy = createWorkspaceCopy(t)

  const params = await searchParams
  const { payments, page, pageSize, totalItems, totalPages } = await getMySubscriptionPayments(params.page)
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(localizeHref(`/account/orders${serializePagination(query, { page })}`, locale))
  }

  if (!payments.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <ReceiptText aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">{t('noPaymentsYet')}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{t('yourConfirmedSubscriptionPaymentsAndRenewalsWillAppearHere')}</p>
        <Button nativeButton={false} variant="outline" render={<Link href="/account/subscription" />}>
          {t('myPlan')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <p className="text-muted-foreground text-sm" role="status">
        {t('showing')} {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} {t('of')} {totalItems} {t('payments')}
      </p>
      <div className="bg-card overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t('paidSubscriptionPayments')}</caption>
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              {[t('dateUTC'), t('description'), t('amount'), t('status'), t('invoice')].map((heading) => (
                <th key={copy(heading)} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                  {copy(heading)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b last:border-0">
                <td className="px-4 py-4 whitespace-nowrap">
                  <time dateTime={payment.paidAt.toISOString()}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(payment.paidAt)}
                  </time>
                </td>
                <td className="min-w-48 px-4 py-4">{payment.description}</td>
                <td className="px-4 py-4 font-medium whitespace-nowrap">{formatPaymentAmount(payment.amount, payment.currency, locale)}</td>
                <td className="px-4 py-4">
                  <Badge variant="secondary">{t('paid')}</Badge>
                </td>
                <td className="px-4 py-4">
                  <InvoiceActions
                    paymentId={payment.id}
                    label={`${payment.description}, ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(payment.paidAt)}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel={t('ordersPages')} />
    </>
  )
}

export default function OrdersPage({ searchParams }: Props) {
  const t = useTranslations('Workspace')

  return (
    <section aria-labelledby="orders-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="orders-heading" className="text-2xl font-semibold">
          {t('orders')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('yourPaidSubscriptionHistoryAndStripeInvoices')}</p>
      </div>
      <Suspense
        fallback={
          <LoadingStatus label={t('loadingYourPayments')} className="space-y-4">
            <Skeleton className="h-5 w-56 max-w-full" />
            <div className="bg-card overflow-hidden rounded-xl border">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="grid grid-cols-[1fr_2fr_1fr] gap-4 border-b p-4 last:border-0 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr]">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="hidden h-6 w-full sm:block" />
                  <Skeleton className="hidden h-6 w-full sm:block" />
                </div>
              ))}
            </div>
          </LoadingStatus>
        }
      >
        <Orders searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
