import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isLocalizedPath, routing, stripLocale } from '@/i18n/routing'

const handleLocale = createMiddleware(routing)

const isUnderDevelopment = process.env.SHOW_UNDER_DEVELOPMENT === 'true'

export function proxy(request: NextRequest) {
  if (isUnderDevelopment && request.nextUrl.pathname !== '/under-development') {
    return NextResponse.redirect(new URL('/under-development', request.url))
  }

  const pathname = request.nextUrl.pathname
  if (isLocalizedPath(stripLocale(pathname))) {
    // Next.js may run Proxy again for the internal /en rewrite. Do not redirect
    // that rewrite back to its public URL. This header controls routing only;
    // translations use the validated root param, and authorization is independent.
    const internalEnglishRewrite = (pathname === '/en' || pathname.startsWith('/en/')) && request.headers.get('x-next-intl-locale') === 'en'
    return internalEnglishRewrite ? NextResponse.next() : handleLocale(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)']
}
