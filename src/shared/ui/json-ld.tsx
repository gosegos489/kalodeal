import 'server-only'
import { type JsonLd as JsonLdData, serializeJsonLd } from '@/lib/json-ld'

export function JsonLd({ data }: { data: JsonLdData | null }) {
  if (!data) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
