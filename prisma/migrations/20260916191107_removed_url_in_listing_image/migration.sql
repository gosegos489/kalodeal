/*
  Warnings:

  - You are about to drop the column `url` on the `listing_image` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `listing_image` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `listing_image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "listing_image" DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "listing_image_key_key" ON "listing_image"("key");
