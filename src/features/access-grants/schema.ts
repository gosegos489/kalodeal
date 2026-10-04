import z from 'zod'

export const grantUserIdSchema = z.string().trim().min(1).max(128)
export const grantReasonSchema = z
  .string()
  .trim()
  .max(500, 'Keep the reason within 500 characters.')
  .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value), 'Use plain text for the reason.')
export const proDurations = [
  { value: 'day', label: '1 day' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
  { value: 'custom', label: 'Custom expiration' }
] as const
export const bumpExpirations = [{ value: 'never', label: 'Never' }, ...proDurations.filter(({ value }) => value !== 'day')]

const expiration = z.iso.datetime().optional()
export const grantProSchema = z
  .object({
    userId: grantUserIdSchema,
    duration: z.enum(['day', 'week', 'month', 'custom']),
    expiresAt: expiration,
    reason: grantReasonSchema.optional()
  })
  .strict()
export const grantBumpsSchema = z
  .object({
    userId: grantUserIdSchema,
    amount: z.number().int().min(1).max(100),
    duration: z.enum(['never', 'week', 'month', 'custom']),
    expiresAt: expiration,
    reason: grantReasonSchema.optional()
  })
  .strict()
export const revokeProSchema = z.object({ userId: grantUserIdSchema, grantId: z.cuid() }).strict()

const days = { day: 1, week: 7, month: 30 }
export const MAX_GRANT_DURATION_MS = 365 * 24 * 60 * 60 * 1000

export function getGrantExpiration(input: { duration: keyof typeof days | 'custom' | 'never'; expiresAt?: string }, now: Date): Date | null {
  if (input.duration === 'never') {
    if (input.expiresAt) throw new Error('Never-expiring grants cannot have an expiration date.')
    return null
  }
  if (input.duration !== 'custom' && input.expiresAt) throw new Error('Use Custom to choose an expiration date.')
  const end = input.duration === 'custom' ? new Date(input.expiresAt ?? '') : new Date(now.getTime() + days[input.duration] * 86400000)
  const duration = end.getTime() - now.getTime()
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_GRANT_DURATION_MS) {
    throw new Error('Choose a future expiration within 365 days.')
  }
  return end
}
