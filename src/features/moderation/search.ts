import type { Prisma } from '@/generated/prisma/client'
import { ListingStatus } from '@/generated/prisma/enums'

export type ModerationSearchParams = { page?: string | string[]; q?: string | string[]; status?: string | string[] }
export const listingStatusOptions = [
  { value: 'ALL', label: 'All statuses' },
  ...Object.values(ListingStatus).map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))
]

export function getModerationQuery(value?: string | string[]) {
  return typeof value === 'string' ? value.trim().slice(0, 150) : ''
}

export function getModerationStatus(value?: string | string[]) {
  return listingStatusOptions.find((option) => option.value === value)?.value ?? 'PENDING'
}

export function userSearchWhere(query: string): Prisma.UserWhereInput {
  if (!query) return {}
  const contains = { contains: query, mode: 'insensitive' } as const
  return { OR: [{ name: contains }, { email: contains }, { id: contains }] }
}

export function listingModerationWhere(params: ModerationSearchParams): Prisma.ListingWhereInput {
  const query = getModerationQuery(params.q)
  const status = getModerationStatus(params.status)
  const statusWhere = status === 'ALL' ? {} : { status: status as ListingStatus }
  if (!query) return statusWhere
  const contains = { contains: query, mode: 'insensitive' } as const
  return {
    AND: [statusWhere, { OR: [{ title: contains }, { id: contains }, { user: { is: { OR: [{ name: contains }, { email: contains }] } } }] }]
  }
}

export function profileModerationWhere(query?: string | string[]): Prisma.UserWhereInput {
  const text = getModerationQuery(query)
  const search = text ? { OR: [userSearchWhere(text), { pendingName: { contains: text, mode: 'insensitive' as const } }] } : {}
  return {
    AND: [{ OR: [{ pendingName: { not: null } }, { pendingAvatarKey: { not: null } }, { avatarCleanupKey: { not: null } }] }, search]
  }
}
