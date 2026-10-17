import { getMessages } from 'next-intl/server'
import 'server-only'
import { cache } from 'react'
import { getCategoryNavigation } from '@/entities/category/get-category-navigation'
import type { CategoryNavigationNode } from '@/entities/category/navigation-tree'
import { CategoryIcon } from '@/entities/category/ui/category-icon'
import { categoryName } from '@/i18n/category-name'
import { type Locale, localizeHref } from '@/i18n/routing'
import { getCategoryPath } from '@/lib/metadata'
import { captureServerException } from '@/lib/sentry-server'
import type { HeaderCategories, HeaderCategory } from './category-navigation-types'

// Shared by desktop and mobile within this render. The Lucide catalogue stays
// on the server; only rendered root icons and translated display data cross over.
export const getHeaderCategories = cache(async (locale: Locale): Promise<HeaderCategories> => {
  try {
    const [tree, messages] = await Promise.all([getCategoryNavigation(), getMessages({ locale })])
    function toDisplay(category: CategoryNavigationNode, root = false): HeaderCategory {
      return {
        id: category.id,
        slug: category.slug,
        label: categoryName(category, messages.CategoryNames),
        href: localizeHref(getCategoryPath(category.slug), locale),
        ...(root && { icon: <CategoryIcon value={category.icon} variant="navigation" /> }),
        children: category.children.map((child) => toDisplay(child))
      }
    }
    return { categories: tree.map((category) => toDisplay(category, true)), unavailable: false }
  } catch (error) {
    await captureServerException(error, { feature: 'category-navigation', operation: 'read' })
    return { categories: [], unavailable: true }
  }
})
