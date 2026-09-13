import 'dotenv/config'

import prisma from '@/lib/prisma'
import { privacy_policy } from './mocks/mocks'

async function createLegalDocument() {
  await prisma.legalDocument.create({
    data: { type: 'PRIVACY_POLICY', content: privacy_policy }
  })
}

createLegalDocument()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)

    await prisma.$disconnect()

    process.exit(1)
  })
