import { CategorySearchNavigation } from '@/features/listing-search/ui/category-search-link'
import type { Locale } from '@/i18n/routing'
import { getSession } from '@/lib/auth-utils'
import { getCurrentYear } from '@/lib/get-current-year'
import { getHeaderCategories } from './get-header-categories'
import MobileMenu from './mobile-menu'

export default async function MobileMenuWithSession({ locale }: { locale: Locale }) {
  const [session, currentYear, categories] = await Promise.all([getSession(true), getCurrentYear(), getHeaderCategories(locale)])

  return (
    <CategorySearchNavigation>
      <MobileMenu isAuth={Boolean(session?.user)} currentYear={currentYear} role={session?.user.role} {...categories} />
    </CategorySearchNavigation>
  )
}
