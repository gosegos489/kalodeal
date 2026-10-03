-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PAID');

-- CreateEnum
CREATE TYPE "ListingCurrency" AS ENUM ('EUR', 'USD');

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "currency" "ListingCurrency" NOT NULL DEFAULT 'EUR';

-- CreateTable
CREATE TABLE "subscription_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PAID',
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_stripeInvoiceId_key" ON "subscription_payment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "subscription_payment_userId_paidAt_id_idx" ON "subscription_payment"("userId", "paidAt", "id");

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
