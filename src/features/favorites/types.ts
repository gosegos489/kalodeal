import type { ListingSummary } from '@/entities/listing/types'
import type { ListingStatus } from '@/generated/prisma/enums'
import type { ActionResult } from '@/lib/action-result'

export type FavoriteListing = Pick<ListingSummary, 'id' | 'title' | 'price' | 'currency' | 'category' | 'coverUrl'> & { status: ListingStatus }

export type FavoriteMutationResult = ActionResult<{ isFavorited: boolean }> | { success: false; message: string; requiresLogin: true }
