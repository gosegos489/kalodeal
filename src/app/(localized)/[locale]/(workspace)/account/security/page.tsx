import { useLocale } from 'next-intl'
import { redirect } from 'next/navigation'
import { localizeHref } from '@/i18n/routing'

export default function SecurityPage() {
  const locale = useLocale()

  redirect(localizeHref('/account/settings#security', locale))
}
