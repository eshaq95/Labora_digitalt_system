/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "certificationInfo" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "hmsCodes" TEXT,
ADD COLUMN     "internalReference" TEXT;

-- AlterTable
ALTER TABLE "public"."SupplierItem" ADD COLUMN     "discountNotes" TEXT,
ADD COLUMN     "packageDescription" TEXT,
ADD COLUMN     "priceCheckSignature" TEXT,
ADD COLUMN     "quantityPerPackage" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "Item_externalId_key" ON "public"."Item"("externalId");
