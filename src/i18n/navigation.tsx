import { getLocale } from 'next-intl/server'
import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import { localizeHref } from './routing'

export async function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = await getLocale()
  return <NextLink href={typeof href === 'string' ? localizeHref(href, locale) : href} {...props} />
}
