/*
  Warnings:

  - Added the required column `userId` to the `listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SusbscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE');

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "bumpedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "listing_stats" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contactClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SusbscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "bumpUsed" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_stats_listingId_key" ON "listing_stats"("listingId");

-- CreateIndex
CREATE INDEX "favorite_listingId_idx" ON "favorite"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_userId_listingId_key" ON "favorite"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_userId_key" ON "subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "listing_userId_idx" ON "listing"("userId");

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_stats" ADD CONSTRAINT "listing_stats_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
