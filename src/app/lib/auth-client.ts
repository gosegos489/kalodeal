import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ac, adminRole, moderatorRole, userRole } from './auth-permissions'

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        user: userRole,
        moderator: moderatorRole,
        admin: adminRole
      }
    })
  ]
})
