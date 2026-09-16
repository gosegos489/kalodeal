import 'dotenv/config'

import prisma from '@/lib/prisma'
import { privacy_policy, terms_of_use } from './mocks/mocks'

async function createLegalDocument() {
  await prisma.$transaction([
    prisma.legalDocument.upsert({
      where: { type: 'PRIVACY_POLICY' },
      create: { type: 'PRIVACY_POLICY', content: privacy_policy },
      update: { content: privacy_policy }
    }),
    prisma.legalDocument.upsert({
      where: { type: 'TERMS_OF_USE' },
      create: { type: 'TERMS_OF_USE', content: terms_of_use },
      update: { content: terms_of_use }
    })
  ])
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
