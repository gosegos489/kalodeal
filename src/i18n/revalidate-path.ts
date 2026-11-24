import { revalidatePath } from 'next/cache'
import 'server-only'
import { isLocalizedPath, localizeHref, routing, stripLocale } from './routing'

export function revalidateLocalizedPath(path: string, type?: 'page' | 'layout') {
  const pathname = stripLocale(path)
  const paths = isLocalizedPath(pathname)
    ? new Set([pathname, `/en${pathname === '/' ? '' : pathname}`, ...routing.locales.map((locale) => localizeHref(pathname, locale))])
    : new Set([path])
  for (const localized of paths) revalidatePath(localized, type)
}
