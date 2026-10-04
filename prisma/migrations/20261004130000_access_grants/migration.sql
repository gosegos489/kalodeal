-- CreateEnum
CREATE TYPE "PlanGrantPlan" AS ENUM ('PRO');

-- CreateTable
CREATE TABLE "plan_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanGrantPlan" NOT NULL DEFAULT 'PRO',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "grantedById" TEXT NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "bumpPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bumpUsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bump_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "grantedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bump_grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_grant_userId_revokedAt_endsAt_idx" ON "plan_grant"("userId", "revokedAt", "endsAt");

-- CreateIndex
CREATE INDEX "plan_grant_userId_createdAt_id_idx" ON "plan_grant"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "plan_grant_grantedById_idx" ON "plan_grant"("grantedById");

-- CreateIndex
CREATE INDEX "bump_grant_userId_expiresAt_idx" ON "bump_grant"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "bump_grant_userId_createdAt_id_idx" ON "bump_grant"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "bump_grant_grantedById_idx" ON "bump_grant"("grantedById");

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bump_grant" ADD CONSTRAINT "bump_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bump_grant" ADD CONSTRAINT "bump_grant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Guard the credit invariant even if a future write path bypasses the UI.
ALTER TABLE "bump_grant" ADD CONSTRAINT "bump_grant_credit_check"
    CHECK ("total" > 0 AND "remaining" >= 0 AND "remaining" <= "total");

ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_period_check"
    CHECK ("endsAt" > "startsAt" AND "bumpUsed" >= 0);
