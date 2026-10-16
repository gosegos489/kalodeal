'use server'

import { updateTag } from 'next/cache'
import type { ActionResult } from '@/lib/action-result'
import { cacheTags } from '@/lib/cache-tags'
import type { LegalEditorDocument } from './schema'
import { legalOperations } from './server'
import { LegalDocumentError } from './workflow'

export async function saveLegalDocument(input: unknown): Promise<ActionResult<LegalEditorDocument & { warning?: string }>> {
  let saved
  try {
    saved = await legalOperations.save(input)
  } catch (error) {
    return {
      success: false,
      message: error instanceof LegalDocumentError ? error.message : 'Could not save the document. Your text is preserved. Please try again.'
    }
  }
  try {
    // Expire only this document; the next public read blocks for the new content.
    updateTag(cacheTags.legalDocument(saved.type))
  } catch {
    // A committed write must not be reported as a failed save or retried with an old version.
    return { success: true, data: { ...saved, warning: 'Saved, but public cache refresh failed. Save again to retry publication.' } }
  }
  return { success: true, data: saved }
}
