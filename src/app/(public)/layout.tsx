import { rootMetadata } from '@/lib/metadata'
import { SiteDocument } from '@/shared/ui/site-document'

export const metadata = rootMetadata

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument>{children}</SiteDocument>
}
