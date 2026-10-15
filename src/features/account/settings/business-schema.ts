import z from 'zod'
import { moderationDecisionSchema } from './schema'

function publicText(max: number) {
  return z
    .string()
    .trim()
    .normalize()
    .max(max, `Use no more than ${max} characters.`)
    .refine((value) => !/[<>\p{Cf}\p{Cc}]/u.test(value.replace(/[\r\n\t]/g, '')), 'Use plain text without markup or control characters.')
}

export const businessDetailsSchema = z
  .object({
    description: publicText(2000),
    address: publicText(300),
    website: z
      .string()
      .trim()
      .pipe(
        z.union([
          z.literal(''),
          z
            .url({ protocol: /^https?$/, hostname: z.regexes.domain })
            .max(500)
            .refine((value) => {
              try {
                const url = new URL(value)
                return !url.username && !url.password
              } catch {
                return false
              }
            }, 'Use a website URL without credentials.')
        ])
      ),
    openingHours: publicText(500)
  })
  .strict()

export const emptyBusinessDetails = { description: '', address: '', website: '', openingHours: '' }
export type BusinessDetails = z.infer<typeof businessDetailsSchema>

export const businessReviewSchema = z
  .object({
    userId: z.string().min(1).max(128),
    version: z.string().regex(/^[a-f0-9]{64}$/)
  })
  .and(moderationDecisionSchema)
