import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { auth } from './auth'
import { ac, adminRole, moderatorRole, userRole } from './auth-permissions'

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
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
