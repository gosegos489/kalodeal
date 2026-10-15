import z from 'zod'
import { AccountType } from '@/generated/prisma/enums'

export const accountTypeSchema = z.enum(AccountType)
