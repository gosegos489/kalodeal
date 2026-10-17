import { CategorySearchNavigation } from '@/features/listing-search/ui/category-search-link'
import type { Locale } from '@/i18n/routing'
import { CategoriesMegaMenu } from './categories-mega-menu'
import { getHeaderCategories } from './get-header-categories'
import { NavigationLinks } from './header-navigation'

export async function CategoryHeaderNavigation({ locale }: { locale: Locale }) {
  const data = await getHeaderCategories(locale)
  return (
    <CategorySearchNavigation>
      <NavigationLinks categoriesControl={<CategoriesMegaMenu {...data} />} />
    </CategorySearchNavigation>
  )
}
