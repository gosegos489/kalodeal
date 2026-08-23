import { prismaAdapter } from 'better-auth/adapters/prisma'
import { betterAuth } from 'better-auth/minimal'
import { admin } from 'better-auth/plugins'
import { ac, adminRole, moderatorRole, userRole } from './auth-permissions'
import prisma from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },

  emailAndPassword: {
    enabled: true
  },

  plugins: [
    admin({
      ac,

      roles: {
        user: userRole,
        moderator: moderatorRole,
        admin: adminRole
      },

      defaultRole: 'user'
    })
  ]
})
