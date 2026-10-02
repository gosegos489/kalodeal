/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[checkoutSessionId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "subscription_stripeCustomerId_idx";

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "checkoutAttempt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "checkoutSessionId" TEXT;

-- CreateTable
CREATE TABLE "stripe_webhook_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stripeCreatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_daily_view" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "listing_daily_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_daily_view_listingId_day_idx" ON "listing_daily_view"("listingId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "listing_daily_view_listingId_visitorHash_day_key" ON "listing_daily_view"("listingId", "visitorHash", "day");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeCustomerId_key" ON "subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_checkoutSessionId_key" ON "subscription"("checkoutSessionId");

-- AddForeignKey
ALTER TABLE "listing_daily_view" ADD CONSTRAINT "listing_daily_view_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
