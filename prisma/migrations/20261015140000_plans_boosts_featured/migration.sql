-- Offline, additive migration. Review and apply manually to the intended database.
-- Historical bump columns and bump_grant are deliberately retained via Prisma @map.
ALTER TYPE "SubscriptionPlan" ADD VALUE 'PLUS' BEFORE 'PRO';
ALTER TYPE "SubscriptionPlan" ADD VALUE 'BUSINESS';
ALTER TABLE "listing" ADD COLUMN "featuredAt" TIMESTAMP(3);
ALTER TABLE "user"
  ADD COLUMN "businessName" VARCHAR(64),
  ADD COLUMN "pendingBusinessName" VARCHAR(64),
  ADD COLUMN "businessNameModerationMessage" TEXT;
CREATE INDEX "listing_status_featuredAt_id_idx" ON "listing"("status", "featuredAt", "id");
CREATE INDEX "listing_userId_status_createdAt_id_idx" ON "listing"("userId", "status", "createdAt", "id");
ALTER TABLE "subscription" ADD COLUMN "stripeStatus" TEXT;
