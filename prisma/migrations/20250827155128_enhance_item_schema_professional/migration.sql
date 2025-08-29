/*
  Warnings:

  - The `category` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shortCode]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ItemCategory" AS ENUM ('HMS', 'KJEMI', 'FISKEHELSE', 'KRYO', 'MOTTAK', 'MIKRO', 'ADMINISTRASJON', 'IT', 'FELLES', 'ANNET');

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiryTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hazardous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lotNumber" TEXT,
ADD COLUMN     "maxStock" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "productNumber" TEXT,
ADD COLUMN     "storageTemp" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "public"."ItemCategory" NOT NULL DEFAULT 'ANNET';

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "shortCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "public"."Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "public"."Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "public"."Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_shortCode_key" ON "public"."Supplier"("shortCode");
