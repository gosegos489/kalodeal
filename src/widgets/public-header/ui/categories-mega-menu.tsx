'use client'

import { Dialog } from '@base-ui/react/dialog'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, LayoutGrid, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type CSSProperties, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CategorySearchLink } from '@/features/listing-search/ui/category-search-link'
import { cn } from '@/lib/utils'
import type { HeaderCategories, HeaderCategory } from './category-navigation-types'

const linkClass = 'hover:text-primary focus-visible:ring-ring/50 rounded-md outline-none focus-visible:ring-2'

export function CategoriesMegaMenu({ categories, unavailable }: HeaderCategories) {
  const t = useTranslations('Navigation')
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<HeaderCategory[]>([])
  const [top, setTop] = useState(80)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const rootsRef = useRef<HTMLUListElement>(null)
  const focusPanel = useRef(false)
  const navigating = useRef(false)
  const panelId = useId()
  const selected = path.at(-1) ?? categories.find((category) => category.children.length > 0)
  const selectedRoot = path[0] ?? selected

  function changeOpen(next: boolean) {
    if (next) {
      navigating.current = false
      setTop(Math.max(8, (triggerRef.current?.closest('header')?.getBoundingClientRect().bottom ?? 72) + 8))
      setPath([])
    }
    setOpen(next)
  }

  function navigate() {
    navigating.current = true
    changeOpen(false)
  }

  useEffect(() => {
    if (!open) return
    // trap-focus keeps the trigger clickable above the backdrop. Explicitly lock
    // page scrolling as this Base UI modal mode leaves it enabled by default.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const desktop = window.matchMedia('(min-width: 1280px)')
    const onResize = () => {
      if (!desktop.matches) setOpen(false)
      else setTop(Math.max(8, (triggerRef.current?.closest('header')?.getBoundingClientRect().bottom ?? 72) + 8))
    }
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (!focusPanel.current) return
    panelRef.current?.scrollTo({ top: 0 })
    panelRef.current?.focus()
    focusPanel.current = false
  }, [path])

  function rootKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-category-root]'))
    const index = items.findIndex((item) => item === document.activeElement)
    const next = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1
    }[event.key]
    if (next !== undefined) {
      event.preventDefault()
      items[next]?.focus()
    } else if (event.key === 'ArrowRight' && selectedRoot?.id === items[index]?.dataset.categoryRoot) {
      event.preventDefault()
      panelRef.current?.querySelector<HTMLElement>('a')?.focus()
    }
  }

  function selectRoot(category: HeaderCategory) {
    if (path.length > 1 || selectedRoot?.id !== category.id) {
      setPath([category])
      panelRef.current?.scrollTo({ top: 0 })
    }
  }

  function drillInto(...next: HeaderCategory[]) {
    focusPanel.current = true
    setPath((current) => [...(current.length ? current : selected ? [selected] : []), ...next])
  }

  const browseButton = (category: HeaderCategory) => (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0"
      aria-label={t('exploreSubcategories', { category: category.label })}
      onClick={() => drillInto(category)}
    >
      <ChevronRight aria-hidden="true" className="size-4" />
    </Button>
  )

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen} modal="trap-focus">
      <Dialog.Trigger
        ref={triggerRef}
        className={cn(
          'text-muted-foreground hover:text-primary focus-visible:ring-ring/50 flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors outline-none focus-visible:ring-2',
          open && 'bg-card text-primary relative z-[60] shadow-sm'
        )}
      >
        {t('categories')}
        <ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          data-category-menu=""
          finalFocus={() => (navigating.current ? false : triggerRef.current)}
          initialFocus={() => rootsRef.current?.querySelector<HTMLElement>('[data-category-root]') ?? true}
          style={{ '--category-menu-top': `${top}px` } as CSSProperties}
          className="bg-card text-card-foreground fixed top-(--category-menu-top) left-1/2 z-50 flex max-h-[calc(100dvh-var(--category-menu-top)-1rem)] w-[min(80rem,calc(100vw-3rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border shadow-xl transition-[opacity,translate] duration-150 data-ending-style:translate-y-1 data-ending-style:opacity-0 data-starting-style:translate-y-1 data-starting-style:opacity-0 motion-reduce:transition-none"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-base font-semibold">
                <LayoutGrid aria-hidden="true" className="text-primary size-5" /> {t('categories')}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-sm">{t('categoryMenuDescription')}</Dialog.Description>
            </div>
            <Dialog.Close render={<Button variant="ghost" size="icon" className="size-10" aria-label={t('close')} />}>
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          {categories.length ? (
            <div className={cn('grid min-h-0', selected ? 'grid-cols-[20rem_minmax(0,1fr)]' : 'grid-cols-1')}>
              <nav aria-label={t('mainCategories')} className="bg-muted/40 min-h-0 overflow-y-auto overscroll-contain p-3">
                <ul ref={rootsRef} tabIndex={-1} onKeyDown={rootKeyDown} className="space-y-1 outline-none">
                  {categories.map((category) => {
                    const active = selectedRoot?.id === category.id
                    const content = (
                      <>
                        <span className="text-primary flex size-14 shrink-0 items-center justify-center">{category.icon}</span>
                        <span className="min-w-0 flex-1 text-left wrap-anywhere">{category.label}</span>
                      </>
                    )
                    const className = cn(
                      'hover:bg-card flex min-h-14 w-full items-center gap-1 rounded-xl text-sm font-medium transition-colors',
                      active && 'bg-card text-primary shadow-sm'
                    )
                    return (
                      <li key={category.id} className={className} onMouseEnter={() => selectRoot(category)}>
                        <CategorySearchLink
                          category={category.slug}
                          data-category-root={category.id}
                          onFocus={() => selectRoot(category)}
                          onSelect={navigate}
                          className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 outline-none focus-visible:ring-2"
                        >
                          {content}
                        </CategorySearchLink>
                        {category.children.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-1 size-10 shrink-0"
                            aria-label={t('exploreSubcategories', { category: category.label })}
                            aria-controls={panelId}
                            aria-expanded={active}
                            onClick={() => setPath([category])}
                          >
                            <ChevronRight aria-hidden="true" className="size-4" />
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </nav>
              {selected && (
                <div
                  ref={panelRef}
                  id={panelId}
                  role="region"
                  aria-label={selected.label}
                  tabIndex={-1}
                  className="focus-visible:ring-ring/50 min-h-0 overflow-y-auto overscroll-contain border-l p-6 outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault()
                      Array.from(rootsRef.current?.querySelectorAll<HTMLElement>('[data-category-root]') ?? [])
                        .find((item) => item.dataset.categoryRoot === selectedRoot?.id)
                        ?.focus()
                    }
                  }}
                >
                  {path.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        focusPanel.current = true
                        setPath((current) => current.slice(0, -1))
                      }}
                      className="mb-4 -ml-2"
                    >
                      <ArrowLeft aria-hidden="true" /> {t('back')}
                    </Button>
                  )}
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <h2 className="min-w-0 text-xl font-semibold wrap-anywhere">{selected.label}</h2>
                    <CategorySearchLink
                      category={selected.slug}
                      onSelect={navigate}
                      className={cn(linkClass, 'text-primary inline-flex min-h-9 items-center gap-2 text-sm font-semibold')}
                    >
                      {t('viewAllListings')} <ArrowRight aria-hidden="true" className="size-4" />
                    </CategorySearchLink>
                  </div>
                  <nav aria-label={t('subcategoriesOf', { category: selected.label })}>
                    <ul className="grid grid-cols-2 items-start gap-x-6 gap-y-7 2xl:grid-cols-3 min-[112rem]:grid-cols-4">
                      {selected.children.map((child) => (
                        <li key={child.id} className="min-w-0">
                          <div className="flex items-center justify-between gap-1 border-b pb-2">
                            <CategorySearchLink
                              category={child.slug}
                              onSelect={navigate}
                              className={cn(linkClass, 'inline-flex min-h-10 items-center text-sm font-semibold wrap-anywhere')}
                            >
                              {child.label}
                            </CategorySearchLink>
                            {child.children.length > 0 && browseButton(child)}
                          </div>
                          {child.children.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {child.children.map((descendant) => (
                                <li key={descendant.id} className="flex items-center justify-between gap-1">
                                  <CategorySearchLink
                                    category={descendant.slug}
                                    onSelect={navigate}
                                    className={cn(linkClass, 'text-muted-foreground inline-flex min-h-9 items-center text-sm wrap-anywhere')}
                                  >
                                    {descendant.label}
                                  </CategorySearchLink>
                                  {descendant.children.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-9 shrink-0"
                                      aria-label={t('exploreSubcategories', { category: descendant.label })}
                                      onClick={() => drillInto(child, descendant)}
                                    >
                                      <ChevronRight aria-hidden="true" />
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <p role="status" className="text-muted-foreground p-8 text-sm">
              {t(unavailable ? 'categoriesUnavailable' : 'noCategories')}
            </p>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
