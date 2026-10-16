import { ChevronRight, MoveRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { getCategorySummaries } from '@/entities/category/get-category-tree'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { CategoryGridSkeleton } from '@/entities/category/ui/category-grid-skeleton'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { localizeHref } from '@/i18n/routing'
import { buildCollectionJsonLd } from '@/lib/json-ld'
import { buildMetadata } from '@/lib/metadata'
import { BreadCrumbs } from '@/shared/ui/BreadCrumbs'
import { JsonLd } from '@/shared/ui/json-ld'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return buildMetadata({ title: t('categoriesTitle'), description: t('categoriesDescription'), path: '/categories', locale, localized: true })
}

async function CategoriesContent() {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations({ locale, namespace: 'Categories' })
  const meta = await getTranslations({ locale, namespace: 'Metadata' })
  const categories = await getCategorySummaries()
  const listingsCount = categories.reduce((total, category) => total + category.listingCount, 0)

  return (
    <>
      <JsonLd
        data={buildCollectionJsonLd({
          title: t('categories'),
          description: meta('categoriesDescription'),
          path: '/categories',
          locale,
          breadcrumbs: [
            { label: t('home'), href: localizeHref('/', locale) },
            { label: t('categories'), href: localizeHref('/categories', locale) }
          ]
        })}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">{t('activeCount', { count: listingsCount })}</p>
          </div>

          <Link href="/" className="text-primary flex items-center gap-2 font-semibold">
            <p>{t('viewLatest')}</p> <MoveRight className="size-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {categories.map((category) => (
              <section key={category.id} className="border-border bg-card overflow-hidden rounded-xl border">
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)]">
                  <CategoryCard {...category} headingLevel={2} />

                  <div className="border-border flex min-w-0 flex-col gap-3 border-t p-4 sm:border-t-0 sm:border-l">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t('subcategories')}</p>

                    {category.children.length > 0 ? (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {category.children.map((child) => (
                          <li key={child.id} className="min-w-0">
                            <Link
                              href={`/?category=${child.slug}`}
                              className="hover:text-primary focus-visible:ring-ring/50 flex w-fit items-center gap-1 rounded-sm text-sm font-medium outline-none focus-visible:ring-2"
                            >
                              <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded">
                                <CategoryIcon value={child.image} size={12} />
                              </span>
                              <h3 className="truncate">{categoryName(child, messages.CategoryNames)}</h3>
                              <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                            </Link>

                            {child.children.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                {child.children.map((grandchild) => (
                                  <Link
                                    key={grandchild.id}
                                    href={`/?category=${grandchild.slug}`}
                                    className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-xs"
                                  >
                                    <CategoryIcon value={grandchild.image} size={10} />
                                    {categoryName(grandchild, messages.CategoryNames)}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">{t('browseCount', { count: category.listingCount })}</p>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border-border bg-card text-muted-foreground flex min-h-36 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm">
            {t('empty')}
          </div>
        )}
      </div>
    </>
  )
}

export default async function CategoriesPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'Categories' })
  return (
    <div className="container flex flex-col gap-4 py-10">
      <div className="flex flex-col gap-4">
        <BreadCrumbs items={[{ label: t('home'), href: localizeHref('/', locale) }, { label: t('categories') }]} />
        <h1 className="text-xl font-bold md:text-3xl">{t('title')}</h1>
      </div>
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  )
}
