import z from 'zod'

const userId = z.string().trim().min(1).max(128)
export const banReasonSchema = z
  .string()
  .trim()
  .min(3, 'Enter a reason with at least 3 characters.')
  .max(500, 'Keep the reason within 500 characters.')
export const banDurations = [
  { value: 'minute', label: '1 minute', seconds: 60 },
  { value: 'ten-minutes', label: '10 minutes', seconds: 600 },
  { value: 'hour', label: '1 hour', seconds: 3600 },
  { value: 'day', label: '1 day', seconds: 86400 },
  { value: 'three-days', label: '3 days', seconds: 259200 },
  { value: 'week', label: '7 days', seconds: 604800 },
  { value: 'month', label: '30 days', seconds: 2592000 }
] as const
export const banDurationSchema = z.enum([...banDurations.map(({ value }) => value), 'custom', 'permanent'])
export const banUserSchema = z
  .object({
    userId,
    banReason: banReasonSchema,
    duration: banDurationSchema,
    expiresAt: z.iso.datetime().optional()
  })
  .strict()
export const unbanUserSchema = z.object({ userId }).strict()
export const banEndpointSchema = z
  .object({
    userId,
    banReason: banReasonSchema,
    banExpiresIn: z.number().int().positive().max(315360000).optional()
  })
  .strict()

export function getBanSeconds(input: z.infer<typeof banUserSchema>, now = Date.now()) {
  if (input.duration === 'permanent') return undefined
  if (input.duration === 'custom') {
    const seconds = input.expiresAt ? Math.ceil((new Date(input.expiresAt).getTime() - now) / 1000) : 0
    if (seconds <= 0 || seconds > 315360000) throw new Error('Choose an expiry in the future, within 10 years.')
    return seconds
  }
  const preset = banDurations.find(({ value }) => value === input.duration)
  if (!preset) throw new Error('Choose a valid duration.')
  return preset.seconds
}
