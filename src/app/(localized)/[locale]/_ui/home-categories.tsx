import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import type { HomepageCategory } from '@/entities/category/get-homepage-categories'
import { CategoryCard } from '@/entities/category/ui/CategoryCard'
import { Link } from '@/i18n/navigation'

export async function HomeCategories({ categories }: { categories: HomepageCategory[] }) {
  const t = await getTranslations('Home')
  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="categories-heading" className="text-xl font-semibold sm:text-2xl">
            {t('browseCategories')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('categoryIntro')}</p>
        </div>
        <Button nativeButton={false} variant="ghost" render={<Link href="/categories" />}>
          {t('allCategories')} <ArrowRight />
        </Button>
      </div>
      {categories.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-card overflow-hidden rounded-xl border">
              <CategoryCard {...category} image={category.icon} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">{t('categoriesUnavailable')}</p>
      )}
    </section>
  )
}
