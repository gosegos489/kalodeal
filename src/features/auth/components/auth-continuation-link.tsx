import { getLocale } from 'next-intl/server'
import 'server-only'
import { Link } from '@/i18n/navigation'
import { getAuthHref } from '../login-redirect'

export type AuthSearchParams = Promise<{ returnTo?: string | string[] }>

export async function AuthContinuationLink({
  href,
  searchParams,
  children
}: {
  href: '/login' | '/register' | '/forgot-password'
  searchParams: AuthSearchParams
  children: React.ReactNode
}) {
  const params = await searchParams
  const hrefWithContinuation = getAuthHref(href, await getLocale(), typeof params.returnTo === 'string' ? params.returnTo : null)
  return (
    <Link href={hrefWithContinuation} className="text-primary font-medium">
      {children}
    </Link>
  )
}
