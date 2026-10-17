'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ComponentProps, type ReactNode, createContext, useContext, useEffect, useRef } from 'react'
import { localizeHref, stripLocale } from '@/i18n/routing'
import { getCategorySearchHref } from '../model/category-href'
import { SEARCH_DEFAULTS } from '../model/query-state'
import { useListingSearch } from '../model/use-listing-search'

type CategoryNavigation = {
  category: string
  isPending: boolean
  href: (category: string) => string
  select: (category: string) => Promise<void>
}

const CategorySearchContext = createContext<CategoryNavigation | null>(null)

// One URL subscription per grid/menu, outside the popup so closing it does not
// discard navigation. Category translations and icons remain server-rendered.
export function CategorySearchNavigation({ children }: { children: ReactNode }) {
  const search = useListingSearch()
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const home = stripLocale(pathname) === '/'
  const request = useRef<{ category: string; origin: string; controller: AbortController } | null>(null)

  useEffect(() => {
    const pending = request.current
    if (!pending) return
    const onHome = stripLocale(pathname) === '/'
    // nuqs publishes optimistic state before flushing history. Use that state
    // for an in-place selection, and the committed URL after a route change.
    const selected = stripLocale(pending.origin) === '/' ? search.category : new URLSearchParams(window.location.search).get('category')
    if (onHome ? selected !== pending.category : pathname !== pending.origin) {
      pending.controller.abort()
    }
  }, [pathname, search.category])
  useEffect(() => () => request.current?.controller.abort(), [])

  function href(category: string) {
    return home
      ? getCategorySearchHref(pathname, new URLSearchParams(params), search.filters, category)
      : getCategorySearchHref(localizeHref('/', locale), new URLSearchParams(), SEARCH_DEFAULTS, category)
  }

  return (
    <CategorySearchContext
      value={{
        category: home ? search.category : '',
        isPending: search.isPending,
        href,
        select: async (category) => {
          request.current?.controller.abort()
          const controller = new AbortController()
          request.current = { category, origin: pathname, controller }
          if (home) {
            if (await search.setCategory(category)) scrollToSearch(category, controller.signal)
          } else {
            router.push(href(category).split('#')[0], { scroll: false })
            scrollToSearch(category, controller.signal)
          }
        }
      }}
    >
      {children}
    </CategorySearchContext>
  )
}

type CategorySearchLinkProps = { category: string; onSelect?: () => void } & Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'>

export function CategorySearchLink({ category, onSelect, ...props }: CategorySearchLinkProps) {
  const search = useContext(CategorySearchContext)
  if (!search) throw new Error('CategorySearchLink requires CategorySearchNavigation')

  return (
    <Link
      {...props}
      href={search.href(category)}
      prefetch={false}
      scroll={false}
      aria-current={search.category === category ? 'true' : undefined}
      aria-busy={search.isPending}
      onNavigate={async (event) => {
        event.preventDefault()
        onSelect?.()
        await search.select(category)
      }}
    />
  )
}

function scrollToSearch(category: string, signal: AbortSignal) {
  if (signal.aborted) return
  // A nuqs promise resolves when the URL is flushed, before streamed RSC UI
  // necessarily commits. Wait for the server-rendered selection on the target.
  const observer = new MutationObserver(scroll)
  let arrived = false
  function cleanup() {
    observer.disconnect()
    signal.removeEventListener('abort', cleanup)
    window.removeEventListener('popstate', cleanup)
  }
  function scroll() {
    if (signal.aborted) return cleanup()
    if (stripLocale(window.location.pathname) !== '/' || new URLSearchParams(window.location.search).get('category') !== category) {
      if (arrived) cleanup()
      return
    }
    arrived = true
    const target = document.getElementById('search-filters')
    // Wait for exit animations, focus traps and scroll locks to be released.
    if (!target || target.dataset.searchCategory !== category || document.querySelector('[data-category-menu]')) return
    cleanup()
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }
  signal.addEventListener('abort', cleanup, { once: true })
  window.addEventListener('popstate', cleanup, { once: true })
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-search-category'] })
  scroll()
}
