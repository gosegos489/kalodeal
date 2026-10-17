import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { betterAuth } from 'better-auth/minimal'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import 'server-only'
import { accountTypeSchema } from '@/entities/user/account-type'
import { guardAuthAccountType, guardAuthProfileData, prepareNewProfileName } from '@/features/account/settings/auth-profile'
import { displayNameSchema } from '@/features/account/settings/schema'
import { captureServerExceptionAfterResponse } from '@/lib/sentry-server'
import { sendAuthEmail } from './auth-email'
import { getAuthOriginOptions } from './auth-origins'
import { ac, adminRole, moderatorRole, userRole } from './auth-permissions'
import { authorizeAuthMutation, normalizeBanUpdate } from './auth-security'
import prisma from './prisma'

export const auth = betterAuth({
  ...getAuthOriginOptions(process.env),
  onAPIError: {
    onError(error) {
      if (error instanceof APIError && error.statusCode < 500) return
      captureServerExceptionAfterResponse(error, { feature: 'auth', operation: 'api' })
      console.error('Authentication request failed.')
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const banBody = await authorizeAuthMutation(ctx)
      if (banBody) return { context: { ...ctx, body: banBody } }
      const isSignUp = ctx.path === '/sign-up/email'
      const isProfileUpdate = ctx.path === '/update-user'
      const isAdminProfile = ctx.path === '/admin/update-user' || ctx.path === '/admin/create-user'
      if (!isSignUp && !isProfileUpdate && !isAdminProfile) return
      const data = ctx.path === '/admin/update-user' ? ctx.body?.data : ctx.body
      if (data != null && (typeof data !== 'object' || Array.isArray(data))) {
        throw new APIError('BAD_REQUEST', { message: 'Invalid profile data.' })
      }
      // The generic auth API must not bypass profile moderation or file cleanup.
      if (data) guardAuthProfileData(data, isProfileUpdate || ctx.path === '/admin/update-user')
      if (data) guardAuthAccountType(data, isProfileUpdate || ctx.path === '/admin/update-user', isSignUp)
      if (data && ['banned', 'banReason', 'banExpires'].some((field) => field in data)) {
        throw new APIError('BAD_REQUEST', { message: 'Manage bans through the ban/unban endpoints.' })
      }
      if (isSignUp || data?.name !== undefined) {
        const parsed = displayNameSchema.safeParse(data?.name ?? '')
        if (!parsed.success) throw new APIError('BAD_REQUEST', { message: parsed.error.issues[0].message })
        if (ctx.path === '/admin/update-user') {
          return { context: { ...ctx, body: { ...ctx.body, data: { ...data, name: parsed.data } } } }
        }
        return { context: { ...ctx, body: { ...ctx.body, name: parsed.data } } }
      }
    })
  },
  databaseHooks: {
    user: {
      create: {
        before: async (data) => ({
          data: { ...data, accountType: accountTypeSchema.parse(data.accountType ?? 'PERSONAL'), ...prepareNewProfileName(data.name) }
        })
      },
      update: {
        before: async (data, ctx) => {
          if ('name' in data || 'accountType' in data) {
            throw new APIError('BAD_REQUEST', { message: 'Manage profile names through account settings and moderation.' })
          }
          return { data: normalizeBanUpdate(data, ctx?.path) }
        }
      }
    }
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  user: {
    additionalFields: {
      accountType: { type: ['PERSONAL', 'BUSINESS'], required: false, defaultValue: 'PERSONAL', validator: { input: accountTypeSchema } },
      businessName: { type: 'string', required: false, input: false, returned: false },
      pendingBusinessName: { type: 'string', required: false, input: false, returned: false },
      businessNameModerationMessage: { type: 'string', required: false, input: false, returned: false },
      pendingName: { type: 'string', required: false, input: false, returned: false },
      nameModerationMessage: { type: 'string', required: false, input: false, returned: false },
      avatarModerationMessage: { type: 'string', required: false, input: false, returned: false }
    }
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },

  rateLimit: {
    enabled: true,

    customRules: {
      '/sign-up/email': {
        window: 60,
        max: 5
      },

      '/sign-in/email': {
        window: 60,
        max: 10
      },
      '/change-password': {
        window: 60,
        max: 5
      }
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,

    async sendResetPassword({ user, url }, request) {
      await sendAuthEmail({ kind: 'reset', email: user.email, url }, request)
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    async sendVerificationEmail({ user, url }, request) {
      await sendAuthEmail({ kind: 'verification', email: user.email, url }, request)
    }
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
    }),
    nextCookies()
  ]
})
