-- CreateEnum
CREATE TYPE "ChatReportReason" AS ENUM ('HARASSMENT', 'SPAM', 'FRAUD', 'OFFENSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ChatReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "chat_report" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" "ChatReportReason" NOT NULL,
    "details" VARCHAR(500),
    "status" "ChatReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "chat_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_report_status_createdAt_id_idx" ON "chat_report"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "chat_report_reporterId_conversationId_reportedUserId_status_idx" ON "chat_report"("reporterId", "conversationId", "reportedUserId", "status");

-- CreateIndex
CREATE INDEX "chat_report_conversationId_idx" ON "chat_report"("conversationId");

-- CreateIndex
CREATE INDEX "chat_report_reportedUserId_idx" ON "chat_report"("reportedUserId");

-- CreateIndex
CREATE INDEX "chat_report_reviewedById_idx" ON "chat_report"("reviewedById");

-- AddForeignKey
ALTER TABLE "chat_report" ADD CONSTRAINT "chat_report_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_report" ADD CONSTRAINT "chat_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_report" ADD CONSTRAINT "chat_report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_report" ADD CONSTRAINT "chat_report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
