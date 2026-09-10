/*
  Warnings:

  - Added the required column `phone` to the `listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "youtube" TEXT;

-- CreateTable
CREATE TABLE "listing_image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_image_listingId_idx" ON "listing_image"("listingId");

-- AddForeignKey
ALTER TABLE "listing_image" ADD CONSTRAINT "listing_image_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
