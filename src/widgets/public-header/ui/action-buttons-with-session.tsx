import { getSession } from '@/lib/auth-utils'
import ActionButtons from './action-buttons'

export default async function ActionButtonsWithSession() {
  const session = await getSession(true)

  return <ActionButtons isAuth={Boolean(session?.user)} role={session?.user.role} />
}
