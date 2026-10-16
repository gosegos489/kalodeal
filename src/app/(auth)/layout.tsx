import type { Metadata } from 'next'
import { privateMetadata, rootMetadata } from '@/lib/metadata'
import { SiteDocument } from '@/shared/ui/site-document'

export const metadata: Metadata = { ...rootMetadata, ...privateMetadata }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument>{children}</SiteDocument>
}
