import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist } from 'next/font/google'
import { Suspense } from 'react'
import '@/app/globals.css'
import { Providers } from '@/app/providers'
import { Toaster } from '@/components/ui/toast'
import type { Locale } from '@/i18n/routing'
import { RouteContent } from '@/shared/ui/route-content'
import { CookieConsentGate } from '@/widgets/cookie-modal/cookie-consent-gate'
import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const isUnderDevelopment = process.env.SHOW_UNDER_DEVELOPMENT === 'true'

export function SiteDocument({
  children,
  locale = 'en'
}: Readonly<{
  children: React.ReactNode
  locale?: Locale
}>) {
  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          {isUnderDevelopment ? (
            children
          ) : (
            <div className="flex min-h-dvh flex-col">
              <PublicHeader locale={locale} />
              <main className="flex-1">
                <RouteContent>{children}</RouteContent>
              </main>
              <PublicFooter locale={locale} />
            </div>
          )}
        </Providers>

        {!isUnderDevelopment && (
          <Suspense fallback={null}>
            <CookieConsentGate />
          </Suspense>
        )}

        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
