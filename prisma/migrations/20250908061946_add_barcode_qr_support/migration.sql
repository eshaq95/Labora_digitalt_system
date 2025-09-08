/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrCode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrCode]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "qrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "public"."Item"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Item_qrCode_key" ON "public"."Item"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Location_qrCode_key" ON "public"."Location"("qrCode");
