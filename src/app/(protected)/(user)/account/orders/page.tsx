import { ReceiptText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPaymentAmount } from '@/features/billing/format-payment-amount'
import { getMySubscriptionPayments } from '@/features/orders/data'
import { InvoiceActions } from '@/features/orders/invoice-actions'
import { dayjs } from '@/lib/dayjs'
import { serializePagination } from '@/lib/pagination'
import NuqsPagination from '@/shared/ui/NuqsPagination'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata: Metadata = { title: 'Orders', robots: { index: false, follow: false } }

async function Orders({ searchParams }: Props) {
  const params = await searchParams
  const { payments, page, pageSize, totalItems, totalPages } = await getMySubscriptionPayments(params.page)
  if (params.page !== undefined && params.page !== String(page)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page' || value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
    }
    redirect(`/account/orders${serializePagination(query, { page })}`)
  }

  if (!payments.length) {
    return (
      <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
        <ReceiptText aria-hidden="true" className="text-muted-foreground size-8" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold">No payments yet</h3>
        <p className="text-muted-foreground max-w-sm text-sm">Your confirmed Pro subscription payments and renewals will appear here.</p>
        <Button nativeButton={false} variant="outline" render={<Link href="/account/subscription" />}>
          My plan
        </Button>
      </div>
    )
  }

  return (
    <>
      <p className="text-muted-foreground text-sm" role="status">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} payments
      </p>
      <div className="bg-card overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Paid Pro subscription payments</caption>
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              {['Date (UTC)', 'Description', 'Amount', 'Status', 'Invoice'].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b last:border-0">
                <td className="px-4 py-4 whitespace-nowrap">
                  <time dateTime={payment.paidAt.toISOString()}>{dayjs.utc(payment.paidAt).format('D MMM YYYY')}</time>
                </td>
                <td className="min-w-48 px-4 py-4">{payment.description}</td>
                <td className="px-4 py-4 font-medium whitespace-nowrap">{formatPaymentAmount(payment.amount, payment.currency)}</td>
                <td className="px-4 py-4">
                  <Badge variant="secondary">Paid</Badge>
                </td>
                <td className="px-4 py-4">
                  <InvoiceActions paymentId={payment.id} label={`${payment.description}, ${dayjs.utc(payment.paidAt).format('D MMM YYYY')}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NuqsPagination totalPages={totalPages} ariaLabel="Orders pages" />
    </>
  )
}

export default function OrdersPage({ searchParams }: Props) {
  return (
    <section aria-labelledby="orders-heading" className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="orders-heading" className="text-2xl font-semibold">
          Orders
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Your paid Pro subscription history and Stripe invoices.</p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4" role="status" aria-label="Loading your payments">
            <Skeleton className="h-64 rounded-xl" />
            <span className="sr-only">Loading your payments...</span>
          </div>
        }
      >
        <Orders searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
