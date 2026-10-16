import { z } from 'zod'

export const LEGAL_MAX_HTML_LENGTH = 100_000
export const legalIdSchema = z.string().cuid()
export const legalSaveSchema = z
  .object({
    id: legalIdSchema,
    updatedAt: z.iso.datetime(),
    content: z.string().max(LEGAL_MAX_HTML_LENGTH, 'The document is too large. Use at most 100,000 HTML characters.')
  })
  .strict()

export type LegalEditorDocument = { id: string; content: string; updatedAt: string }
