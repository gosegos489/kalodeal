'use client'

import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CategorySearchLink } from '@/features/listing-search/ui/category-search-link'
import type { HeaderCategories, HeaderCategory } from './category-navigation-types'

// One screen per level, regardless of taxonomy depth. No nested drawers.
export function MobileCategories({ categories, unavailable, onExit, onNavigate }: HeaderCategories & { onExit: () => void; onNavigate: () => void }) {
  const t = useTranslations('Navigation')
  const [path, setPath] = useState<HeaderCategory[]>([])
  const current = path.at(-1)
  const items = current?.children ?? categories
  const titleRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const returnTo = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    const previous = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-category-id]') ?? []).find(
      (element) => element.dataset.categoryId === returnTo.current
    )
    const target = previous ?? titleRef.current
    target?.focus()
    returnTo.current = null
  }, [path])

  function back() {
    if (!current) return onExit()
    returnTo.current = current.id
    setPath((value) => value.slice(0, -1))
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      <Button variant="ghost" onClick={back} className="mb-3 min-h-11 max-w-full gap-2 px-3">
        <ArrowLeft aria-hidden="true" /> {t('back')}
      </Button>
      <h3
        ref={titleRef}
        tabIndex={-1}
        className="focus-visible:ring-ring/50 mx-3 mb-3 rounded-sm text-lg font-semibold wrap-anywhere outline-none focus-visible:ring-2"
      >
        {current?.label ?? t('mainCategories')}
      </h3>
      {current && (
        <CategorySearchLink
          category={current.slug}
          onSelect={onNavigate}
          className="text-primary bg-primary/5 focus-visible:ring-ring/50 mb-4 flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus-visible:ring-2"
        >
          {t('viewAllListings')} <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </CategorySearchLink>
      )}
      {items.length ? (
        <nav aria-label={current ? t('subcategoriesOf', { category: current.label }) : t('mainCategories')}>
          <ul ref={listRef} className="space-y-1">
            {items.map((category) => {
              const content = (
                <>
                  {category.icon && <span className="text-primary flex size-12 shrink-0 items-center justify-center">{category.icon}</span>}
                  <span className="min-w-0 flex-1 text-left wrap-anywhere">{category.label}</span>
                </>
              )
              const className =
                'hover:bg-muted focus-visible:ring-ring/50 flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2'
              return (
                <li key={category.id} className="flex min-w-0 items-center gap-1">
                  <CategorySearchLink category={category.slug} onSelect={onNavigate} data-category-id={category.id} className={className}>
                    {content}
                  </CategorySearchLink>
                  {category.children.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label={t('exploreSubcategories', { category: category.label })}
                      onClick={() => setPath((value) => [...value, category])}
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      ) : (
        <p role="status" className="text-muted-foreground px-3 py-6 text-sm">
          {t(unavailable ? 'categoriesUnavailable' : 'noCategories')}
        </p>
      )}
    </div>
  )
}
