import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Suspense } from 'react'
import { Toaster } from '@/components/ui/toast'
import { rootMetadata } from '@/lib/metadata'
import { CookieConsentGate } from '@/widgets/cookie-modal/cookie-consent-gate'
import { PublicFooter } from '@/widgets/public-footer/public-footer'
import { PublicHeader } from '@/widgets/public-header/public-header'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const isUnderDevelopment = process.env.SHOW_UNDER_DEVELOPMENT === 'true'

export const metadata: Metadata = rootMetadata

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          {isUnderDevelopment ? (
            children
          ) : (
            <div className="flex min-h-dvh flex-col">
              <PublicHeader />
              <main className="flex-1">{children}</main>
              <PublicFooter />
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
