import { getSession } from '@/lib/auth-utils'
import MobileMenu from './mobile-menu'

export default async function MobileMenuWithSession() {
  const session = await getSession()

  return <MobileMenu isAuth={Boolean(session?.user)} />
}
