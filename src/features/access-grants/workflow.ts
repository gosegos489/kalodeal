import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { isActivePlanGrant } from '@/lib/plan-limits'
import { activePlanGrantWhere } from '@/lib/user-access'
import { AccessGrantError } from './error'
import { canManageAccessGrants } from './permission'
import { getGrantExpiration, grantBumpsSchema, grantProSchema, revokeProSchema } from './schema'

// Cooperate with owner quota/bump/billing locks. Sorting avoids cross-staff deadlocks.
async function authorizeGrant(tx: Prisma.TransactionClient, actorId: string, userId: string) {
  for (const id of [...new Set([actorId, userId])].sort()) {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${id} FOR UPDATE`
  }
  const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, banned: true, banExpires: true } })
  if (!actor || !canManageAccessGrants(actor)) throw new AccessGrantError('You cannot manage access grants.')
  const target = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!target) throw new AccessGrantError('This user no longer exists.')
}

function parseInput<T>(schema: { parse: (input: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input)
  } catch {
    throw new AccessGrantError('Check the grant details and try again.')
  }
}

function expiration(input: Parameters<typeof getGrantExpiration>[0], now: Date) {
  try {
    return getGrantExpiration(input, now)
  } catch (error) {
    throw new AccessGrantError(error instanceof Error ? error.message : 'Invalid expiration.')
  }
}

export async function grantProAccess(tx: Prisma.TransactionClient, actorId: string, input: unknown) {
  const data = parseInput(grantProSchema, input)
  await authorizeGrant(tx, actorId, data.userId)
  const now = new Date()
  const endsAt = expiration(data, now)
  if (!endsAt) throw new AccessGrantError('PRO access must expire.')
  const existing = await tx.planGrant.findFirst({ where: activePlanGrantWhere(data.userId, now), select: { id: true } })
  if (existing) throw new AccessGrantError('This user already has active complimentary PRO access. Revoke it before issuing a replacement.')
  await tx.planGrant.create({
    data: { userId: data.userId, plan: 'PRO', startsAt: now, endsAt, grantedById: actorId, reason: data.reason || null, bumpPeriodStart: now },
    select: { id: true }
  })
  return { userId: data.userId, message: 'PRO access granted.' }
}

export async function revokeProAccess(tx: Prisma.TransactionClient, actorId: string, input: unknown) {
  const data = parseInput(revokeProSchema, input)
  await authorizeGrant(tx, actorId, data.userId)
  const now = new Date()
  const grant = await tx.planGrant.findFirst({
    where: { id: data.grantId, userId: data.userId },
    select: { plan: true, startsAt: true, endsAt: true, revokedAt: true }
  })
  if (!isActivePlanGrant(grant, now)) throw new AccessGrantError('This complimentary grant is no longer active.')
  const revoked = await tx.planGrant.updateMany({
    where: { id: data.grantId, ...activePlanGrantWhere(data.userId, now) },
    data: { revokedAt: now }
  })
  if (revoked.count !== 1) throw new AccessGrantError('This grant has changed. Reload and try again.')
  return { userId: data.userId, message: 'Complimentary PRO access revoked. Paid subscriptions are unaffected.' }
}

export async function grantBonusBumps(tx: Prisma.TransactionClient, actorId: string, input: unknown) {
  const data = parseInput(grantBumpsSchema, input)
  await authorizeGrant(tx, actorId, data.userId)
  const expiresAt = expiration(data, new Date())
  await tx.bumpGrant.create({
    data: { userId: data.userId, total: data.amount, remaining: data.amount, grantedById: actorId, expiresAt, reason: data.reason || null },
    select: { id: true }
  })
  return { userId: data.userId, message: `${data.amount} bonus bumps granted.` }
}
