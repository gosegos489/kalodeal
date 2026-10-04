-- Preserve existing submissions and their statuses; NEW becomes OPEN in place.
ALTER TYPE "ContactUsStatus" RENAME VALUE 'NEW' TO 'OPEN';
ALTER TABLE "contact_us" ADD COLUMN "viewedAt" TIMESTAMP(3);

CREATE INDEX "contact_us_createdAt_id_idx" ON "contact_us"("createdAt", "id");
CREATE INDEX "contact_us_status_createdAt_id_idx" ON "contact_us"("status", "createdAt", "id");
