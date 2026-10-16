'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { defaultRateLimit, useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { searchParsers } from '@/features/listing-search/model/query-state'
import { isLocalizedPath, localizeHref, routing, stripLocale } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('Navigation')
  const router = useRouter()
  const [, setFilters] = useQueryStates(searchParsers, { shallow: true, scroll: false })
  const [pending, startTransition] = useTransition()
  return (
    <div role="group" aria-label={t('language')} aria-busy={pending} className="flex shrink-0 items-center rounded-lg border p-0.5 text-xs">
      {routing.locales.map((nextLocale) => (
        <button
          key={nextLocale}
          type="button"
          lang={nextLocale}
          aria-label={nextLocale === 'en' ? 'English' : 'Ελληνικά'}
          aria-pressed={locale === nextLocale}
          disabled={pending}
          className="hover:bg-muted aria-pressed:bg-muted aria-pressed:text-primary min-h-9 rounded-md px-2 font-semibold disabled:opacity-50"
          onClick={() => {
            if (nextLocale === locale) return
            startTransition(async () => {
              try {
                const path = stripLocale(window.location.pathname)
                const hash = window.location.hash
                let search = window.location.search
                if (path === '/') {
                  const existing = new URLSearchParams(search)
                  // Flush all search keys together: typing also queues dependent
                  // district/area/page updates. Await them before changing the path
                  // so a delayed nuqs router.replace cannot restore the old locale.
                  const updated = await setFilters(
                    (current) =>
                      Object.fromEntries(Object.entries(current).map(([key, value]) => [key, value || (existing.get(key) === '' ? '' : null)])),
                    { limitUrlUpdates: defaultRateLimit, shallow: true, history: 'replace', clearOnDefault: false }
                  )
                  search = updated.size ? `?${updated}` : ''
                }
                const href = isLocalizedPath(path) ? `${path}${search}${hash}` : '/'
                router.push(localizeHref(href, nextLocale), { scroll: false })
              } catch {
                toast.add({ type: 'error', title: t('languageError'), description: t('retry') })
              }
            })
          }}
        >
          {nextLocale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
