import { getSession } from '@/lib/auth-utils'
import MobileMenu from './mobile-menu'
import { getCurrentYear } from '@/lib/get-current-year'

export default async function MobileMenuWithSession() {
  const session = await getSession()
  const currentYear = await getCurrentYear()

  return <MobileMenu isAuth={Boolean(session?.user)} currentYear={currentYear} />
}
