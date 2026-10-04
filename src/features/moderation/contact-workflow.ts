import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { ContactUsQuestion } from '@/generated/prisma/enums'
import { hasActiveBan } from '@/lib/ban-status'
import { getPagination } from '@/lib/pagination'
import { type ContactSearchParams, contactFilterSchema, contactIdSchema, contactStatusSchema } from './contact-schema'

type Actor = { id: string; role?: string | null; banned?: boolean | null; banExpires?: Date | null }
type Dependencies = { db: PrismaClient; moderatorActor: () => Promise<Actor | null> }
export class ContactRequestError extends Error {}

const detailSelect = {
  id: true,
  contactEmail: true,
  question: true,
  message: true,
  status: true,
  viewedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ContactUsSelect

export function getContactFilters(params: ContactSearchParams) {
  const filter = contactFilterSchema.safeParse(params.status)
  const status = filter.success ? filter.data : 'ALL'
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 150) : ''
  const where: Prisma.ContactUsWhereInput = status === 'ALL' ? {} : status === 'UNREAD' ? { viewedAt: null } : { status }
  if (query) {
    const contains = { contains: query, mode: 'insensitive' } as const
    const topics = Object.values(ContactUsQuestion).filter((topic) => topic.toLowerCase().includes(query.toLowerCase()))
    where.OR = [{ id: contains }, { contactEmail: contains }, ...(topics.length ? [{ question: { in: topics } }] : [])]
  }
  return { status, query, where }
}

// Feature-local dependencies keep focused checks independent of real auth/DB services.
export function createContactOperations({ db, moderatorActor }: Dependencies) {
  async function moderator() {
    const actor = await moderatorActor()
    if (!actor || hasActiveBan(actor) || (actor.role !== 'moderator' && actor.role !== 'admin')) {
      throw new ContactRequestError('Moderator access is required.')
    }
    return actor
  }
  async function checkActor(tx: Prisma.TransactionClient, id: string) {
    const actor = await tx.user.findUnique({ where: { id }, select: { role: true, banned: true, banExpires: true } })
    if (!actor || hasActiveBan(actor) || (actor.role !== 'moderator' && actor.role !== 'admin')) {
      throw new ContactRequestError('Moderator access is required.')
    }
  }

  async function getTickets(params: ContactSearchParams) {
    await moderator()
    const { status, query, where } = getContactFilters(params)
    return db.$transaction(
      async (tx) => {
        const totalItems = await tx.contactUs.count({ where })
        const pagination = getPagination({ pageParam: params.page, totalItems, pageSize: 20 })
        const rows = await tx.contactUs.findMany({
          where,
          select: { id: true, contactEmail: true, question: true, message: true, status: true, viewedAt: true, createdAt: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: pagination.skip,
          take: pagination.take
        })
        // Existing public validation bounds messages to 600 chars. Only the preview reaches queue UI.
        const tickets = rows.map(({ message, ...ticket }) => ({ ...ticket, preview: message.slice(0, 160) }))
        return { tickets, status, query, ...pagination }
      },
      { isolationLevel: 'RepeatableRead' }
    )
  }

  async function getTicket(input: unknown) {
    await moderator()
    const parsed = contactIdSchema.safeParse(input)
    return parsed.success ? db.contactUs.findUnique({ where: { id: parsed.data }, select: detailSelect }) : null
  }

  async function markViewed(input: unknown) {
    const actor = await moderator()
    const parsed = contactIdSchema.safeParse(input)
    if (!parsed.success) throw new ContactRequestError('Invalid contact request ID.')
    return db.$transaction(async (tx) => {
      await checkActor(tx, actor.id)
      const ticket = await tx.contactUs.findUnique({ where: { id: parsed.data }, select: { id: true, viewedAt: true } })
      if (!ticket) throw new ContactRequestError('Contact request is no longer available.')
      if (ticket.viewedAt === null) {
        // One winner for concurrent opens; repeat opens do not touch updatedAt.
        await tx.contactUs.updateMany({ where: { id: ticket.id, viewedAt: null }, data: { viewedAt: new Date() } })
      }
      return ticket.id
    })
  }

  async function changeStatus(input: unknown) {
    const actor = await moderator()
    const parsed = contactStatusSchema.safeParse(input)
    if (!parsed.success) throw new ContactRequestError('Invalid contact request update.')
    const { id, status, updatedAt } = parsed.data
    return db.$transaction(async (tx) => {
      await checkActor(tx, actor.id)
      const ticket = await tx.contactUs.findUnique({ where: { id }, select: { status: true, updatedAt: true } })
      if (!ticket) throw new ContactRequestError('Contact request is no longer available.')
      if (ticket.status === status) return id
      if (ticket.updatedAt.toISOString() !== updatedAt) throw new ContactRequestError('This request has changed. Refresh and try again.')
      const result = await tx.contactUs.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data: { status } })
      if (!result.count) throw new ContactRequestError('This request has changed. Refresh and try again.')
      return id
    })
  }
  return { getTickets, getTicket, markViewed, changeStatus }
}
