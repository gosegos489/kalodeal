-- Prepared offline. Existing users remain PERSONAL; no subscriptions or listings change.
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'BUSINESS');

ALTER TABLE "user" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'PERSONAL';

CREATE TABLE "business_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" VARCHAR(2000),
    "address" VARCHAR(300),
    "website" VARCHAR(500),
    "openingHours" VARCHAR(500),
    "pendingDetails" JSONB,
    "moderationMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_profile_userId_key" ON "business_profile"("userId");
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
