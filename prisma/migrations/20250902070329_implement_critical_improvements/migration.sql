/*
  Warnings:

  - You are about to drop the column `password` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `portalPassword` on the `Supplier` table. All the data in the column will be lost.
  - Made the column `requestedBy` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `receivedBy` on table `Receipt` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'PURCHASER', 'LAB_USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."CountingStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED');

-- AlterTable
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "requestedBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Receipt" ALTER COLUMN "receivedBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Supplier" DROP COLUMN "password",
DROP COLUMN "portalPassword",
ADD COLUMN     "credentialsNotes" TEXT,
ADD COLUMN     "credentialsVaultId" TEXT;

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'LAB_USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryTransaction" (
    "id" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2),
    "totalValue" DECIMAL(10,2),
    "notes" TEXT,
    "reasonCode" TEXT,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "receiptId" TEXT,
    "countingSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CycleCountingSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."CountingStatus" NOT NULL DEFAULT 'PLANNED',
    "locationId" TEXT,
    "categoryId" TEXT,
    "departmentId" TEXT,
    "plannedBy" TEXT NOT NULL,
    "countedBy" TEXT,
    "approvedBy" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "countedItems" INTEGER NOT NULL DEFAULT 0,
    "discrepancies" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleCountingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CycleCountingLine" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "discrepancy" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),
    "countedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CycleCountingLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryLotId_idx" ON "public"."InventoryTransaction"("inventoryLotId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_userId_idx" ON "public"."InventoryTransaction"("userId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "public"."InventoryTransaction"("type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "public"."InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CycleCountingSession_status_idx" ON "public"."CycleCountingSession"("status");

-- CreateIndex
CREATE INDEX "CycleCountingSession_plannedDate_idx" ON "public"."CycleCountingSession"("plannedDate");

-- CreateIndex
CREATE UNIQUE INDEX "CycleCountingLine_sessionId_inventoryLotId_key" ON "public"."CycleCountingLine"("sessionId", "inventoryLotId");

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receipt" ADD CONSTRAINT "Receipt_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_countingSessionId_fkey" FOREIGN KEY ("countingSessionId") REFERENCES "public"."CycleCountingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_plannedBy_fkey" FOREIGN KEY ("plannedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_countedBy_fkey" FOREIGN KEY ("countedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingSession" ADD CONSTRAINT "CycleCountingSession_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingLine" ADD CONSTRAINT "CycleCountingLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."CycleCountingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingLine" ADD CONSTRAINT "CycleCountingLine_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."InventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CycleCountingLine" ADD CONSTRAINT "CycleCountingLine_countedBy_fkey" FOREIGN KEY ("countedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
