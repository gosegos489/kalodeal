import type { ActionResult } from '@/lib/action-result'

export type RevealListingPhoneResult = ActionResult<{ phone: string }> | { success: false; message: string; requiresLogin: true }
