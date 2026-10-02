import type { ActionResult } from '@/lib/action-result'

export type FavoriteMutationResult = ActionResult<{ isFavorited: boolean }> | { success: false; message: string; requiresLogin: true }
