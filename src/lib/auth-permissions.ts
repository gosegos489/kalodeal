import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,

  listing: ['create', 'update', 'delete', 'moderate']
} as const

export const ac = createAccessControl(statement)

export const userRole = ac.newRole({
  listing: ['create', 'update', 'delete']
})

export const moderatorRole = ac.newRole({
  listing: ['create', 'update', 'delete', 'moderate'],

  user: ['list', 'get', 'ban']
})

export const adminRole = ac.newRole({
  ...adminAc.statements,

  listing: ['create', 'update', 'delete', 'moderate']
})
