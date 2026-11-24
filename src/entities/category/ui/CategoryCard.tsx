import { ArrowUpRight } from 'lucide-react'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { type ReactElement, type ReactNode, cloneElement } from 'react'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { CategoryIcon } from './category-icon'

type CardLinkProps = { className?: string; children?: ReactNode }
type CategoryCardProps = {
  name: string
  slug: string
  image: string | null
  listingCount?: number
  headingLevel?: 2 | 3
  render?: ReactElement<CardLinkProps>
}

export async function CategoryCard({ headingLevel = 3, render, ...category }: CategoryCardProps) {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Categories' })
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const props: CardLinkProps = {
    className:
      'focus-visible:ring-ring/50 hover:bg-primary/5 hover:border-primary/30 bg-card group relative flex h-full min-h-40 min-w-0 flex-col items-center gap-3 rounded-xl border px-3 py-5 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-inset sm:min-h-48 sm:gap-4 sm:p-5 motion-reduce:transition-none',
    children: (
      <>
        <span className="text-primary flex shrink-0 items-center justify-center">
          <CategoryIcon value={category.image} variant="card" />
        </span>
        <ArrowUpRight className="text-muted-foreground/60 group-hover:text-primary absolute top-3 right-3 size-3.5" aria-hidden="true" />
        <Heading className="w-full min-w-0 text-sm leading-snug font-semibold wrap-anywhere sm:text-[15px]">
          {categoryName(category, messages.CategoryNames)}
        </Heading>
        {category.listingCount !== undefined && (
          <span className="text-muted-foreground mt-auto text-xs font-medium">
            {t(category.slug === 'jobs' ? 'openings' : 'count', { count: category.listingCount })}
          </span>
        )}
      </>
    )
  }
  return render ? cloneElement(render, props) : <Link href={`/?category=${category.slug}`} {...props} />
}
