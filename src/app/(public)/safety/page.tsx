import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { buildMetadata } from '@/lib/metadata'
import { Flag, ShieldAlert, Wallet } from 'lucide-react'
import { buyerTips, generalTips, sellerTips } from './mocks/mocks'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Marketplace Safety Tips',
    description:
      'Safety tips for buying and selling on Kalodeal: meet safely, avoid scams, protect your personal information, and make every local deal with confidence.',
    path: '/safety'
  })
}
export default function SafetyPage() {
  return (
    <div className="flex flex-col gap-16 px-4 py-16 md:px-8 lg:px-16">
      <section className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary">Trust & Safety</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Buy and Sell <span className="text-primary">Safely</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Kalodeal connects people directly, so a few precautions go a long way. Here&apos;s how to keep every deal safe and simple.
        </p>
      </section>

      <section className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {generalTips.map((tip) => (
            <Card key={tip.title}>
              <CardHeader className="flex flex-col gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                  <tip.icon className="size-5" />
                </div>
                <CardTitle>{tip.title}</CardTitle>
                <CardDescription>{tip.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Tips for sellers</h2>
          <ul className="flex flex-col gap-3">
            {sellerTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <ShieldAlert className="size-3.5" />
                </div>
                <span className="text-muted-foreground text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Tips for buyers</h2>
          <ul className="flex flex-col gap-3">
            {buyerTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Wallet className="size-3.5" />
                </div>
                <span className="text-muted-foreground text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Alert className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Flag className="size-4" />
          <AlertTitle>See something suspicious?</AlertTitle>
        </div>
        <AlertDescription>
          Report the listing or user directly from the profile page, or contact our support team. Every report is reviewed by our team.
        </AlertDescription>
      </Alert>
    </div>
  )
}
