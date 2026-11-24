import { getSession } from '@/lib/auth-utils'
import ActionButtons from './action-buttons'
import { LanguageSwitcher } from './language-switcher'

export default async function ActionButtonsWithSession() {
  const session = await getSession(true)
  const role = session?.user.role

  return (
    <>
      <ActionButtons isAuth={Boolean(session?.user)} role={role} />
      {role !== 'moderator' && role !== 'admin' && <LanguageSwitcher />}
    </>
  )
}
