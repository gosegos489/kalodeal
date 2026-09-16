-- CreateEnum
CREATE TYPE "ContactUsQuestion" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactUsStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "contact_us" (
    "id" TEXT NOT NULL,
    "question" "ContactUsQuestion" NOT NULL,
    "message" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "status" "ContactUsStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_us_pkey" PRIMARY KEY ("id")
);
