/*
  Warnings:

  - The `status` column on the `subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE');

-- DropIndex
DROP INDEX "listing_userId_idx";

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "sortDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "SusbscriptionStatus";

-- CreateIndex
CREATE INDEX "listing_userId_status_idx" ON "listing"("userId", "status");

-- CreateIndex
CREATE INDEX "listing_status_sortDate_idx" ON "listing"("status", "sortDate");

-- CreateIndex
CREATE INDEX "subscription_stripeCustomerId_idx" ON "subscription"("stripeCustomerId");
