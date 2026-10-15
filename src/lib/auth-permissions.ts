import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,

  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon']
} as const

export const ac = createAccessControl(statement)

export const userRole = ac.newRole({
  listing: ['create', 'update', 'delete']
})

export const moderatorRole = ac.newRole({
  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon'],

  user: ['list', 'get', 'ban']
})

export const adminRole = ac.newRole({
  ...adminAc.statements,

  listing: ['create', 'update', 'delete', 'moderate'],
  category: ['update-icon']
})

export function canManageCategoryIcons(role: string | null | undefined) {
  const permissions = role === 'admin' ? adminRole : role === 'moderator' ? moderatorRole : null
  return permissions?.authorize({ category: ['update-icon'] }).success ?? false
}
