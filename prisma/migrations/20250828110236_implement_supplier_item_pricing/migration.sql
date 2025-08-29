/*
  Warnings:

  - You are about to drop the column `agreementPrice` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `listPrice` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `productNumber` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `productUrl` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "agreementPrice",
DROP COLUMN "listPrice",
DROP COLUMN "productNumber",
DROP COLUMN "productUrl",
ADD COLUMN     "salesPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Supplier" DROP COLUMN "shippingCost",
ADD COLUMN     "orderingInstructions" TEXT,
ADD COLUMN     "shippingNotes" TEXT,
ADD COLUMN     "standardShippingCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."SupplierItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierPartNumber" TEXT NOT NULL,
    "productUrl" TEXT,
    "listPrice" DECIMAL(10,2),
    "negotiatedPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NOK',
    "discountCodeRequired" TEXT,
    "agreementReference" TEXT,
    "priceValidUntil" TIMESTAMP(3),
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimarySupplier" BOOLEAN NOT NULL DEFAULT false,
    "minimumOrderQty" INTEGER,
    "packSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierItem_itemId_idx" ON "public"."SupplierItem"("itemId");

-- CreateIndex
CREATE INDEX "SupplierItem_supplierId_idx" ON "public"."SupplierItem"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierItem_itemId_supplierId_key" ON "public"."SupplierItem"("itemId", "supplierId");

-- AddForeignKey
ALTER TABLE "public"."SupplierItem" ADD CONSTRAINT "SupplierItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierItem" ADD CONSTRAINT "SupplierItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
