import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,

  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon'],
  legal: ['update']
} as const

export const ac = createAccessControl(statement)

export const userRole = ac.newRole({
  listing: ['create', 'update', 'delete']
})

export const moderatorRole = ac.newRole({
  legal: ['update'],
  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon'],

  user: ['list', 'get', 'ban']
})

export const adminRole = ac.newRole({
  legal: ['update'],
  ...adminAc.statements,

  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon']
})

export function canManageCategoryIcons(role: string | null | undefined) {
  const permissions = role === 'admin' ? adminRole : role === 'moderator' ? moderatorRole : null
  return permissions?.authorize({ category: ['update-icon'] }).success ?? false
}

export function canManageLegalDocuments(role: string | null | undefined) {
  const permissions = role === 'admin' ? adminRole : role === 'moderator' ? moderatorRole : null
  return permissions?.authorize({ legal: ['update'] }).success ?? false
}
