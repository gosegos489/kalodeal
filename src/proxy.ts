import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isUnderDevelopment = process.env.SHOW_UNDER_DEVELOPMENT === 'true'

export function proxy(request: NextRequest) {
  if (!isUnderDevelopment || request.nextUrl.pathname === '/under-development') {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/under-development', request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)'
  ]
}
