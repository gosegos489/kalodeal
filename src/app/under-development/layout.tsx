import { rootMetadata } from '@/lib/metadata'
import { SiteDocument } from '@/shared/ui/site-document'

export const metadata = rootMetadata
export default function UnderDevelopmentLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument>{children}</SiteDocument>
}
