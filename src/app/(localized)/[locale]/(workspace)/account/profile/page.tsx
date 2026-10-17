import { useLocale } from 'next-intl'
import { redirect } from 'next/navigation'
import { localizeHref } from '@/i18n/routing'

export default function ProfilePage() {
  const locale = useLocale()

  redirect(localizeHref('/account/settings#profile', locale))
}
