import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { buildMetadata } from '@/lib/metadata'
import { buyerSteps, features, sellerSteps } from './mocks/mocks'

export const metadata = buildMetadata({
  title: 'How It Works',
  description: 'Learn how to buy and sell locally on Kalodeal: create a listing, connect with people nearby, and complete deals safely.',
  path: '/how-it-works'
})

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-16 px-4 py-16 md:px-8 lg:px-16">
      <section className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary">Getting started</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          How <span className="text-primary">Kalodeal</span> Works
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Kalodeal connects buyers and sellers in your area. Post an ad, find a deal, and get things done — no fees, no hassle.
        </p>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">Selling on Kalodeal</h2>
          <p className="text-muted-foreground">Four simple steps to your first sale.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sellerSteps.map((step, index) => (
            <Card key={step.title} className="relative">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Step {index + 1}</span>
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">Buying on Kalodeal</h2>
          <p className="text-muted-foreground">Find what you&apos;re looking for in three steps.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {buyerSteps.map((step, index) => (
            <Card key={step.title}>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Step {index + 1}</span>
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold">Why Kalodeal</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-muted/50 border-none shadow-none">
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
