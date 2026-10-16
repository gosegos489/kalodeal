import { ArrowUpRight } from 'lucide-react'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { CategoryIcon } from './category-icon'

type CategoryCardProps = { name: string; slug: string; image: string | null; description: string | null; listingCount?: number; headingLevel?: 2 | 3 }

export async function CategoryCard({ headingLevel = 3, ...category }: CategoryCardProps) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Categories' })
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <Link
      href={`/?category=${category.slug}`}
      className="focus-visible:ring-ring/50 bg-muted/20 hover:bg-primary/5 group flex h-full min-h-36 min-w-0 flex-col gap-3 p-4 transition-colors outline-none focus-visible:ring-3"
    >
      <span className="flex items-center justify-between">
        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <CategoryIcon value={category.image} size={24} />
        </span>
        <ArrowUpRight className="text-muted-foreground/60 size-4" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading className="text-[15px] font-semibold wrap-anywhere">{categoryName(category, messages.CategoryNames)}</Heading>
        <span className="text-muted-foreground truncate text-xs">
          {locale === 'en' && category.description ? category.description : t('explore')}
        </span>
        {category.listingCount !== undefined && (
          <span className="text-muted-foreground text-[11px] font-medium">
            {t(category.slug === 'jobs' ? 'openings' : 'count', { count: category.listingCount })}
          </span>
        )}
      </div>
    </Link>
  )
}
