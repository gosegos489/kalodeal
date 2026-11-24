import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import type { HomepageCategory } from '@/entities/category/get-homepage-categories'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { CategorySearchLink, CategorySearchNavigation } from '@/features/listing-search/ui/category-search-link'
import { ClientMessages } from '@/i18n/client-messages'

export async function HomeCategories({ categories }: { categories: HomepageCategory[] }) {
  const t = await getTranslations('Home')
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="categories-heading" className="text-xl font-semibold sm:text-2xl">
            {t('browseCategories')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('categoryIntro')}</p>
        </div>
      </div>
      {categories.length ? (
        <ClientMessages locale={locale} messages={{ Search: { updateError: messages.Search.updateError, retry: messages.Search.retry } }}>
          <CategorySearchNavigation>
            <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} {...category} image={category.icon} render={<CategorySearchLink category={category.slug} />} />
              ))}
            </div>
          </CategorySearchNavigation>
        </ClientMessages>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">{t('categoriesUnavailable')}</p>
      )}
    </section>
  )
}
