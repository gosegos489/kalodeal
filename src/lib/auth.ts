import { prismaAdapter } from 'better-auth/adapters/prisma'
import { betterAuth } from 'better-auth/minimal'
import { admin } from 'better-auth/plugins'
import 'server-only'
import React from 'react'
import ResetPasswordEmail from '../../emails/ResetPasswordEmail'
import VerifyEmail from '../../emails/VerifyEmail'
import { ac, adminRole, moderatorRole, userRole } from './auth-permissions'
import prisma from './prisma'
import { resend, resendFrom } from './resend'

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
      }
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,

    async sendResetPassword({ user, url }) {
      await resend.emails.send({
        from: resendFrom,
        to: user.email,
        subject: 'Reset your KaloDeal password',
        react: React.createElement(ResetPasswordEmail, { verificationUrl: url })
      })
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    async sendVerificationEmail({ user, url }) {
      await resend.emails.send({
        from: resendFrom,
        to: user.email,
        subject: 'Verify your KaloDeal email address',
        react: React.createElement(VerifyEmail, { verificationUrl: url })
      })
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
    })
  ]
})
