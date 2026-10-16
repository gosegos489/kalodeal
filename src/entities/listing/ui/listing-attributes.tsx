import { getLocale, getMessages } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getListingAttributeSections } from '@/features/listing-attributes/display'
import type { ListingAttributes } from '@/features/listing-attributes/schema'

export async function ListingAttributeDetails({
  categorySlug,
  attributes,
  staff = false
}: {
  categorySlug: string
  attributes: ListingAttributes
  staff?: boolean
}) {
  const locale = staff ? 'en' : await getLocale()
  const messages = await getMessages({ locale })
  const sections = getListingAttributeSections(categorySlug, attributes, staff, { locale, ...messages.Attributes })
  if (!sections.length) return null
  return (
    <Card className="order-3 min-w-0 lg:order-0">
      <CardContent className="space-y-6">
        {sections.map(({ title, details }) => (
          <section key={title} aria-label={title} className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle>
                <h2>{title}</h2>
              </CardTitle>
            </CardHeader>
            <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
              {details.map(({ label, value }) => (
                <div key={label} className="min-w-0 space-y-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="wrap-anywhere">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
