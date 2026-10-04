-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "moderationMessage" TEXT,
ADD COLUMN     "moderationReason" TEXT;
