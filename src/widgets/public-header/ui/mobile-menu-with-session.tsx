import { getSession } from '@/lib/auth-utils'
import { getCurrentYear } from '@/lib/get-current-year'
import MobileMenu from './mobile-menu'

export default async function MobileMenuWithSession() {
  const session = await getSession(true)
  const currentYear = await getCurrentYear()

  return <MobileMenu isAuth={Boolean(session?.user)} currentYear={currentYear} role={session?.user.role} />
}
