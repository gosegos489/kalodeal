'use server'

import { revalidatePath } from 'next/cache'
import 'server-only'
import type { ActionMessageResult, ActionResult } from '@/lib/action-result'
import prisma from '@/lib/prisma'
import { captureServerException } from '@/lib/sentry-server'
import { AccessGrantError } from './error'
import { getGrantExpiration, grantBumpsSchema, grantProSchema } from './schema'
import { getAccessGrantManager } from './server'
import { grantBonusBumps, grantProAccess, revokeProAccess } from './workflow'

async function changeGrant(work: typeof grantProAccess, input: unknown): Promise<ActionMessageResult> {
  let saved: { userId: string; message: string }
  try {
    const actor = await getAccessGrantManager()
    saved = await prisma.$transaction((tx) => work(tx, actor.id, input))
  } catch (error) {
    if (error instanceof AccessGrantError) return { success: false, message: error.message }
    await captureServerException(error, { feature: 'access-grants', operation: 'change' })
    console.error('Could not update access grant.')
    return { success: false, message: 'Could not update access. Please try again.' }
  }
  try {
    revalidatePath('/moderator/access-grants')
    revalidatePath(`/moderator/access-grants/${encodeURIComponent(saved.userId)}`)
    revalidatePath('/account', 'layout')
    revalidatePath('/sell')
  } catch {
    return { success: true, message: `${saved.message} Reload to see the updated access.` }
  }
  return { success: true, message: saved.message }
}

export async function grantPro(input: unknown) {
  return changeGrant(grantProAccess, input)
}
export async function revokePro(input: unknown) {
  return changeGrant(revokeProAccess, input)
}
export async function grantBumps(input: unknown) {
  return changeGrant(grantBonusBumps, input)
}

// Preset expiration is quoted by the server before the confirmation step.
export async function previewGrant(input: unknown, kind: 'pro' | 'bumps'): Promise<ActionResult<{ expiresAt: string | null }>> {
  try {
    await getAccessGrantManager()
    if (kind !== 'pro' && kind !== 'bumps') return { success: false, message: 'Invalid grant type.' }
    const parsed = (kind === 'pro' ? grantProSchema : grantBumpsSchema).safeParse(input)
    if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } })
    if (!user) return { success: false, message: 'This user no longer exists.' }
    const expiresAt = getGrantExpiration(parsed.data, new Date())
    return { success: true, data: { expiresAt: expiresAt?.toISOString() ?? null } }
  } catch (error) {
    if (error instanceof AccessGrantError) return { success: false, message: error.message }
    return { success: false, message: 'Choose a valid future expiration within 365 days.' }
  }
}
