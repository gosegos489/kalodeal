import z from 'zod'
import { contactUsSchema } from './schema'

export type ContactUsSchemaTypes = z.infer<typeof contactUsSchema>
